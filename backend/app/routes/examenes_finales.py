import logging
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.database.session import get_db
from app.database import models
from app.schemas.examen_final import ExamenFinalConPreguntas, ExamenFinalDetailResponse
from app.schemas.quiz import PreguntaConOpciones, OpcionResponse, PreguntaConfigResponse
from app.schemas.intento import IntentoResponse, IntentoSubmission, IntentoResult
from app.services.examen_final_service import ExamenFinalService
from app.services.usuario_service import UsuarioService
from app.utils.jwt_auth import get_current_user
from app.utils.roles import is_admin
from app.utils.exceptions import AuthorizationError, NotFoundError

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/examenes-finales", tags=["Examenes Finales"])


@router.get(
	"/{examen_final_id}",
	response_model=ExamenFinalConPreguntas,
	status_code=status.HTTP_200_OK,
)
async def get_examen_final(
	examen_final_id: UUID,
	db: AsyncSession = Depends(get_db),
	token_payload: Optional[dict] = Depends(get_current_user),
):
	"""
	Obtener examen final con todas sus preguntas y opciones.
	
	- **Permisos**: Requiere autenticación. El usuario debe estar inscrito en el curso asociado
	- **Parámetros**: `examen_final_id` - ID del examen final
	- **Respuesta**: Examen final completo con todas sus preguntas, opciones y configuraciones
	"""
	service = ExamenFinalService(db)
	
	usuario_id = None
	admin = False
	if token_payload:
		usuario_service = UsuarioService(db)
		usuario = await usuario_service.get_by_cognito_id(token_payload.get("sub"))
		if usuario:
			usuario_id = usuario.id
		admin = is_admin(token_payload)
	
	examen = await service.get_examen_final_with_preguntas(examen_final_id)
	
	if not admin and usuario_id:
		inscripcion = await db.execute(
			select(models.InscripcionCurso).where(
				and_(
					models.InscripcionCurso.usuario_id == usuario_id,
					models.InscripcionCurso.curso_id == examen.curso_id,
				)
			)
		)
		inscripcion_obj = inscripcion.scalar_one_or_none()
		
		if not inscripcion_obj:
			raise AuthorizationError("No estás inscrito en este curso")
	
	preguntas_response = []
	for pregunta in examen.preguntas:
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
	
	return ExamenFinalConPreguntas(
		id=examen.id,
		curso_id=examen.curso_id,
		titulo=examen.titulo,
		publicado=examen.publicado,
		aleatorio=examen.aleatorio,
		guarda_calificacion=examen.guarda_calificacion,
		creado_en=examen.creado_en,
		actualizado_en=examen.actualizado_en,
		numero_preguntas=len(examen.preguntas),
		preguntas=preguntas_response,
	)


@router.post(
	"/{examen_final_id}/intentos",
	response_model=IntentoResponse,
	status_code=status.HTTP_201_CREATED,
)
async def create_intento_examen(
	examen_final_id: UUID,
	db: AsyncSession = Depends(get_db),
	token_payload: dict = Depends(get_current_user),
):
	"""
	Crear un nuevo intento de examen final.
	
	- **Permisos**: Requiere autenticación. El usuario debe estar inscrito en el curso asociado
	- **Parámetros**: `examen_final_id` - ID del examen final
	- **Respuesta**: Intento creado y listo para responder
	"""
	service = ExamenFinalService(db)
	usuario_service = UsuarioService(db)
	
	usuario = await usuario_service.get_by_cognito_id(token_payload.get("sub"))
	if not usuario:
		raise AuthorizationError("Usuario no encontrado")
	
	intento = await service.iniciar_intento_con_validacion(
		usuario_id=usuario.id,
		examen_final_id=examen_final_id,
	)
	
	return IntentoResponse.from_orm(intento)


@router.put(
	"/{examen_final_id}/intentos/{intento_id}",
	response_model=IntentoResult,
	status_code=status.HTTP_200_OK,
)
async def update_intento_examen(
	examen_final_id: UUID,
	intento_id: UUID,
	payload: IntentoSubmission,
	db: AsyncSession = Depends(get_db),
	token_payload: dict = Depends(get_current_user),
):
	"""
	Enviar respuestas de un intento de examen final y obtener resultado.
	
	- **Permisos**: Requiere autenticación. El usuario debe ser propietario del intento
	- **Parámetros**: 
	  - `examen_final_id` - ID del examen final
	  - `intento_id` - ID del intento
	  - `respuestas` - Lista de respuestas del intento
	- **Respuesta**: Resultado del intento con puntuación, estado de aprobación y respuestas evaluadas
	"""
	service = ExamenFinalService(db)
	usuario_service = UsuarioService(db)
	
	usuario = await usuario_service.get_by_cognito_id(token_payload.get("sub"))
	if not usuario:
		raise AuthorizationError("Usuario no encontrado")
	
	from app.services.intento_service import IntentoService
	intento_service = IntentoService(db)
	intento = await intento_service.get_intento(intento_id)
	
	if intento.usuario_id != usuario.id:
		raise AuthorizationError("No tienes permiso para modificar este intento")
	
	if intento.examen_final_id != examen_final_id:
		raise AuthorizationError("El intento no pertenece a este examen final")
	
	intento_finalizado = await service.enviar_respuestas(
		intento_id=intento_id,
		respuestas=[r.dict() for r in payload.respuestas],
	)
	
	resultado = await service.construir_intento_result(intento_finalizado)
	return resultado


@router.get(
	"/{examen_final_id}/intentos",
	response_model=List[IntentoResponse],
	status_code=status.HTTP_200_OK,
)
async def list_intentos_examen(
	examen_final_id: UUID,
	db: AsyncSession = Depends(get_db),
	token_payload: Optional[dict] = Depends(get_current_user),
	skip: int = Query(0, ge=0, description="Número de registros a omitir"),
	limit: int = Query(100, ge=1, le=1000, description="Número máximo de registros a retornar"),
):
	"""
	Obtener historial de intentos de un examen final para el usuario autenticado.

	- **Permisos**: Requiere autenticación.
	- **Paginación**: Usa `skip` y `limit` para paginación.
	- **Respuesta**: Lista paginada de intentos de examen final.
	"""
	service = ExamenFinalService(db)
	
	usuario_id = None
	if token_payload:
		usuario_service = UsuarioService(db)
		usuario = await usuario_service.get_by_cognito_id(token_payload.get("sub"))
		if usuario:
			usuario_id = usuario.id
	
	intentos = await service.list_intentos(examen_final_id, usuario_id=usuario_id, skip=skip, limit=limit)
	return [IntentoResponse.from_orm(intento) for intento in intentos]

