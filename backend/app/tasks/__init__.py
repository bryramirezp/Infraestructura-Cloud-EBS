"""
Módulo de tareas de background para FastAPI BackgroundTasks.

Este módulo contiene todas las tareas asíncronas que se ejecutan en background,
desacopladas del request-response cycle.

Importante: Todas las tareas deben crear su propia sesión de BD usando
app.utils.background_tasks.get_background_db_session()
"""

