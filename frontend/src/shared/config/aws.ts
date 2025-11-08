// Configuración opcional de AWS Amplify
// Solo se configura si tenemos credenciales reales de AWS

const USE_AWS_SERVICES = import.meta.env.VITE_COGNITO_USER_POOL_ID &&
                        import.meta.env.VITE_COGNITO_USER_POOL_ID !== 'your-user-pool-id' &&
                        import.meta.env.VITE_COGNITO_CLIENT_ID &&
                        import.meta.env.VITE_COGNITO_CLIENT_ID !== 'your-client-id';

if (USE_AWS_SERVICES) {
  // Solo importar y configurar si tenemos credenciales reales
  import('aws-amplify').then(({ Amplify }) => {
    Amplify.configure({
      Auth: {
        Cognito: {
          userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
          userPoolClientId: import.meta.env.VITE_COGNITO_CLIENT_ID
        }
      }
    });

    console.log('✅ AWS Amplify configurado con servicios reales');
  }).catch(error => {
    console.warn('⚠️ Error configurando AWS Amplify:', error);
  });
} else {
  console.log('🔧 Modo desarrollo: Usando autenticación mock (sin AWS Cognito)');
}

export default {};