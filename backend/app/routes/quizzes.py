import logging
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.schemas.quiz import QuizConPreguntas, QuizDetailResponse, PreguntaConOpciones, OpcionResponse, PreguntaConfigResponse
from app.schemas.intento import IntentoResponse, IntentoSubmission, IntentoResult
from app.services.quiz_service import QuizService
from app.services.usuario_service import UsuarioService
from app.services.leccion_service import LeccionService
from app.utils.jwt_auth import get_current_user
from app.utils.roles import is_admin
from app.utils.exceptions import AuthorizationError

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/quizzes", tags=["Quizzes"])


@router.get(
	"/{quiz_id}",
	response_model=QuizConPreguntas,
	status_code=status.HTTP_200_OK,
)
async def get_quiz(
	quiz_id: UUID,
	db: AsyncSession = Depends(get_db),
	token_payload: Optional[dict] = Depends(get_current_user),
):
	"""
	Obtener quiz con todas sus preguntas y opciones.
	
	- **Permisos**: Requiere autenticación (opcional, pero necesario para validar acceso a la lección)
	- **Parámetros**: `quiz_id` - ID del quiz
	- **Respuesta**: Quiz completo con todas sus preguntas, opciones y configuraciones
	"""
	service = QuizService(db)
	
	usuario_id = None
	admin = False
	if token_payload:
		usuario_service = UsuarioService(db)
		usuario = await usuario_service.get_by_cognito_id(token_payload.get("sub"))
		if usuario:
			usuario_id = usuario.id
		admin = is_admin(token_payload)
	
	quiz = await service.get_quiz_with_preguntas(quiz_id)
	
	if not admin and usuario_id:
		leccion_service = LeccionService(db)
		await leccion_service.validate_acceso_leccion(quiz.leccion_id, usuario_id, admin)
	
	preguntas_response = []
	for pregunta in quiz.preguntas:
		opciones_response = [
			OpcionResponse.from_orm(opcion) for opcion in pregunta.opciones
		]
		
		config_response = None
		if pregunta.config:
			config_response = PreguntaConfigResponse.from_orm(pregunta.config)
		
		preguntas_response.append(
			PreguntaConOpciones(
				id=pregunta.id,
				quiz_id=pregunta.quiz_id,
				examen_final_id=pregunta.examen_final_id,
				enunciado=pregunta.enunciado,
				puntos=pregunta.puntos,
				orden=pregunta.orden,
				creado_en=pregunta.creado_en,
				actualizado_en=pregunta.actualizado_en,
				opciones=opciones_response,
				config=config_response,
			)
		)
	
	return QuizConPreguntas(
		id=quiz.id,
		leccion_id=quiz.leccion_id,
		titulo=quiz.titulo,
		publicado=quiz.publicado,
		aleatorio=quiz.aleatorio,
		guarda_calificacion=quiz.guarda_calificacion,
		creado_en=quiz.creado_en,
		actualizado_en=quiz.actualizado_en,
		numero_preguntas=len(quiz.preguntas),
		preguntas=preguntas_response,
	)


@router.post(
	"/{quiz_id}/intentos",
	response_model=IntentoResponse,
	status_code=status.HTTP_201_CREATED,
)
async def create_intento_quiz(
	quiz_id: UUID,
	db: AsyncSession = Depends(get_db),
	token_payload: dict = Depends(get_current_user),
):
	"""
	Crear un nuevo intento de quiz.
	
	- **Permisos**: Requiere autenticación. El usuario debe estar inscrito en el curso asociado
	- **Parámetros**: `quiz_id` - ID del quiz
	- **Respuesta**: Intento creado y listo para responder
	"""
	service = QuizService(db)
	usuario_service = UsuarioService(db)
	
	usuario = await usuario_service.get_by_cognito_id(token_payload.get("sub"))
	if not usuario:
		raise AuthorizationError("Usuario no encontrado")
	
	intento = await service.iniciar_intento_con_validacion(
		usuario_id=usuario.id,
		quiz_id=quiz_id,
	)
	
	return IntentoResponse.from_orm(intento)


@router.put(
	"/{quiz_id}/intentos/{intento_id}",
	response_model=IntentoResult,
	status_code=status.HTTP_200_OK,
)
async def update_intento_quiz(
	quiz_id: UUID,
	intento_id: UUID,
	payload: IntentoSubmission,
	db: AsyncSession = Depends(get_db),
	token_payload: dict = Depends(get_current_user),
):
	"""
	Enviar respuestas de un intento de quiz y obtener resultado.
	
	- **Permisos**: Requiere autenticación. El usuario debe ser propietario del intento
	- **Parámetros**: 
	  - `quiz_id` - ID del quiz
	  - `intento_id` - ID del intento
	  - `respuestas` - Lista de respuestas del intento
	- **Respuesta**: Resultado del intento con puntuación, estado de aprobación y respuestas evaluadas
	"""
	service = QuizService(db)
	usuario_service = UsuarioService(db)
	
	usuario = await usuario_service.get_by_cognito_id(token_payload.get("sub"))
	if not usuario:
		raise AuthorizationError("Usuario no encontrado")
	
	from app.services.intento_service import IntentoService
	intento_service = IntentoService(db)
	intento = await intento_service.get_intento(intento_id)
	
	if intento.usuario_id != usuario.id:
		raise AuthorizationError("No tienes permiso para modificar este intento")
	
	if intento.quiz_id != quiz_id:
		raise AuthorizationError("El intento no pertenece a este quiz")
	
	intento_finalizado = await service.enviar_respuestas(
		intento_id=intento_id,
		respuestas=[r.dict() for r in payload.respuestas],
	)
	
	resultado = await service.construir_intento_result(intento_finalizado)
	return resultado


@router.get(
	"/{quiz_id}/intentos",
	response_model=List[IntentoResponse],
	status_code=status.HTTP_200_OK,
)
async def list_intentos_quiz(
	quiz_id: UUID,
	db: AsyncSession = Depends(get_db),
	token_payload: Optional[dict] = Depends(get_current_user),
	skip: int = Query(0, ge=0, description="Número de registros a omitir"),
	limit: int = Query(100, ge=1, le=1000, description="Número máximo de registros a retornar"),
):
	"""
	Obtener historial de intentos de un quiz para el usuario autenticado.

	- **Permisos**: Requiere autenticación.
	- **Paginación**: Usa `skip` y `limit` para paginación.
	- **Respuesta**: Lista paginada de intentos de quiz.
	"""
	service = QuizService(db)
	
	usuario_id = None
	if token_payload:
		usuario_service = UsuarioService(db)
		usuario = await usuario_service.get_by_cognito_id(token_payload.get("sub"))
		if usuario:
			usuario_id = usuario.id
	
	intentos = await service.list_intentos(quiz_id, usuario_id=usuario_id, skip=skip, limit=limit)
	return [IntentoResponse.from_orm(intento) for intento in intentos]

