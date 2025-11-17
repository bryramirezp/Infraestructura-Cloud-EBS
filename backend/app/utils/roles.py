from fastapi import Depends
from typing import List, Optional
from app.utils.jwt_auth import get_current_user, get_user_groups_from_token
from app.utils.exceptions import AuthorizationError
import logging

logger = logging.getLogger(__name__)


class UserRole:
    """User roles constants"""
    STUDENT = "student"
    COORDINATOR = "coordinator"
    ADMIN = "admin"
    
    # Cognito group names (can be different from role names)
    COGNITO_STUDENT = "estudiantes"
    COGNITO_COORDINATOR = "coordinadores"
    COGNITO_ADMIN = "administradores"
    
    # Mapping from Cognito groups to roles
    COGNITO_TO_ROLE = {
        COGNITO_STUDENT: STUDENT,
        COGNITO_COORDINATOR: COORDINATOR,
        COGNITO_ADMIN: ADMIN,
    }
    
    @classmethod
    def get_role_from_cognito_group(cls, cognito_group: str) -> Optional[str]:
        """Map Cognito group to role"""
        return cls.COGNITO_TO_ROLE.get(cognito_group, cognito_group)
    
    @classmethod
    def get_roles_from_token(cls, token_payload: dict) -> List[str]:
        """Extract roles from token payload"""
        groups = get_user_groups_from_token(token_payload)
        roles = []
        for group in groups:
            role = cls.get_role_from_cognito_group(group)
            if role:
                roles.append(role)
        return roles


def require_role(allowed_roles: List[str]):
    """
    Dependency factory to require specific roles
    
    Usage:
        @router.get("/admin/users")
        async def get_users(current_user = Depends(require_role([UserRole.ADMIN]))):
            ...
    """
    def role_checker(current_user: dict = Depends(get_current_user)) -> dict:
        user_roles = UserRole.get_roles_from_token(current_user)
        
        if not user_roles:
            logger.warning(f"User {current_user.get('sub')} has no roles assigned")
            raise AuthorizationError("User has no roles assigned")
        
        if not any(role in allowed_roles for role in user_roles):
            logger.warning(
                f"User {current_user.get('sub')} with roles {user_roles} "
                f"attempted to access endpoint requiring {allowed_roles}"
            )
            raise AuthorizationError(
                f"Required roles: {', '.join(allowed_roles)}. "
                f"User has: {', '.join(user_roles)}"
            )
        
        return current_user
    
    return role_checker


def require_any_role(*allowed_roles: str):
    """
    Dependency factory to require any of the specified roles
    
    Usage:
        @router.get("/content")
        async def get_content(
            current_user = Depends(require_any_role(UserRole.ADMIN, UserRole.COORDINATOR))
        ):
            ...
    """
    def role_checker(current_user: dict = Depends(get_current_user)) -> dict:
        user_roles = UserRole.get_roles_from_token(current_user)
        
        if not user_roles:
            raise AuthorizationError("User has no roles assigned")
        
        allowed_list = list(allowed_roles)
        if not any(role in allowed_list for role in user_roles):
            raise AuthorizationError(
                f"Required one of: {', '.join(allowed_list)}. "
                f"User has: {', '.join(user_roles)}"
            )
        
        return current_user
    
    return role_checker


def get_user_role(current_user: dict) -> Optional[str]:
    """Get the primary role of the current user"""
    roles = UserRole.get_roles_from_token(current_user)
    if not roles:
        return None
    
    # Priority: ADMIN > COORDINATOR > STUDENT
    if UserRole.ADMIN in roles:
        return UserRole.ADMIN
    if UserRole.COORDINATOR in roles:
        return UserRole.COORDINATOR
    if UserRole.STUDENT in roles:
        return UserRole.STUDENT
    
    return roles[0] if roles else None


def is_admin(current_user: dict) -> bool:
    """Check if user is admin"""
    return UserRole.ADMIN in UserRole.get_roles_from_token(current_user)


def is_coordinator(current_user: dict) -> bool:
    """Check if user is coordinator"""
    return UserRole.COORDINATOR in UserRole.get_roles_from_token(current_user)


def is_student(current_user: dict) -> bool:
    """Check if user is student"""
    return UserRole.STUDENT in UserRole.get_roles_from_token(current_user)

