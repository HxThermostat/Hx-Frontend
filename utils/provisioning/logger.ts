/**
 * Provisioning Logger
 * 
 * Sistema de logging para provisioning que funciona en desarrollo y producción.
 * En producción, usa console.warn para que aparezca en logcat (Android) y logs nativos (iOS).
 */

export enum ProvisionLogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

export enum ProvisionErrorType {
  NETWORK = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT_ERROR',
  AUTH = 'AUTH_ERROR',
  GRAPHQL = 'GRAPHQL_ERROR',
  VALIDATION = 'VALIDATION_ERROR',
  BACKEND = 'BACKEND_ERROR',
  UNKNOWN = 'UNKNOWN_ERROR',
}

interface LogContext {
  dsn?: string | null;
  setupToken?: string;
  peripheral?: string;
  ssid?: string;
  timestamp?: string;
  [key: string]: any;
}

class ProvisionLogger {
  private uiCallback?: (msg: string) => void;

  /**
   * Registra un callback para mostrar mensajes en la UI
   */
  setUICallback(callback: (msg: string) => void): void {
    this.uiCallback = callback;
  }

  /**
   * Log general - usa console.log en dev, console.warn en producción
   */
  private log(level: ProvisionLogLevel, message: string, context?: LogContext): void {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` | Context: ${JSON.stringify(context)}` : '';
    const logMessage = `[${timestamp}] [PROVISION] [${level}] ${message}${contextStr}`;

    // En producción, usar console.warn para que aparezca en logcat
    if (__DEV__) {
      console.log(logMessage);
    } else {
      console.warn(logMessage);
    }

    // Enviar a la UI si hay callback registrado
    if (this.uiCallback) {
      this.uiCallback(`[${level}] ${message}`);
    }
  }

  /**
   * Analiza un error de Apollo Client y determina su tipo
   */
  analyzeApolloError(error: any): {
    type: ProvisionErrorType;
    details: string;
    isRecoverable: boolean;
  } {
    const errorMessage = error?.message || String(error);
    const errorName = error?.name || 'Unknown';
    const graphQLErrors = error?.graphQLErrors || [];
    const networkError = error?.networkError;

    // Analizar tipo de error
    let type = ProvisionErrorType.UNKNOWN;
    let details = '';
    let isRecoverable = true;

    // 1. Timeout/Aborted
    if (errorMessage.includes('Aborted') || errorMessage.includes('timeout') || errorName === 'AbortError') {
      type = ProvisionErrorType.TIMEOUT;
      details = `Apollo Client timeout reached (10s default). Device may be slow to respond.`;
      isRecoverable = true;
    }
    // 2. Network errors
    else if (networkError || errorMessage.includes('Network') || errorMessage.includes('Failed to fetch')) {
      type = ProvisionErrorType.NETWORK;
      details = `Network connectivity issue. Device may not have internet access. NetworkError: ${networkError?.message || 'Unknown'}`;
      isRecoverable = true;
    }
    // 3. Auth errors
    else if (errorMessage.includes('UNAUTHENTICATED') || errorMessage.includes('Unauthorized') || errorMessage.includes('401')) {
      type = ProvisionErrorType.AUTH;
      details = `Authentication failed. Token may be expired or invalid.`;
      isRecoverable = false;
    }
    // 4. GraphQL errors
    else if (graphQLErrors.length > 0) {
      type = ProvisionErrorType.GRAPHQL;
      const errorCodes = graphQLErrors.map((e: any) => e.extensions?.code || 'NO_CODE').join(', ');
      const errorMessages = graphQLErrors.map((e: any) => e.message).join('; ');
      details = `GraphQL error(s): [${errorCodes}] ${errorMessages}`;
      isRecoverable = false;
    }
    // 5. Validation errors
    else if (errorMessage.includes('Variable') || errorMessage.includes('validation')) {
      type = ProvisionErrorType.VALIDATION;
      details = `Input validation error. Check DSN and setupToken format.`;
      isRecoverable = false;
    }
    // 6. Backend errors
    else if (errorMessage.includes('500') || errorMessage.includes('Internal Server')) {
      type = ProvisionErrorType.BACKEND;
      details = `Backend server error. Server may be down or experiencing issues.`;
      isRecoverable = true;
    }

    return { type, details, isRecoverable };
  }

  /**
   * Log específico para errores de registro
   */
  logRegistrationError(error: any, context?: LogContext): void {
    const analysis = this.analyzeApolloError(error);
    
    const errorContext = {
      ...context,
      errorName: error?.name,
      errorMessage: error?.message,
      errorType: analysis.type,
      isRecoverable: analysis.isRecoverable,
    };

    // Log principal con el tipo de error
    this.log(
      ProvisionLogLevel.ERROR,
      `Registration failed: ${analysis.type}`,
      errorContext
    );

    // Log con detalles del análisis
    this.log(
      ProvisionLogLevel.ERROR,
      `Error details: ${analysis.details}`,
      {}
    );

    // Log adicional con el error completo (solo en producción para logcat)
    if (!__DEV__) {
      console.warn('[PROVISION] [ERROR] Full error object:', JSON.stringify(error, null, 2));
    }

    // Recomendaciones basadas en el tipo de error
    const recommendations = this.getErrorRecommendations(analysis.type);
    this.log(
      ProvisionLogLevel.INFO,
      `Recommendation: ${recommendations}`,
      {}
    );
  }

  /**
   * Obtiene recomendaciones basadas en el tipo de error
   */
  private getErrorRecommendations(errorType: ProvisionErrorType): string {
    switch (errorType) {
      case ProvisionErrorType.TIMEOUT:
        return 'Device is taking too long to respond. Ensure device is powered on and connected to WiFi network.';
      case ProvisionErrorType.NETWORK:
        return 'Check internet connectivity. Ensure device has access to the internet.';
      case ProvisionErrorType.AUTH:
        return 'Authentication failed. User may need to re-login.';
      case ProvisionErrorType.GRAPHQL:
        return 'Server rejected the request. Check if DSN and setupToken are valid.';
      case ProvisionErrorType.VALIDATION:
        return 'Invalid input data. Verify DSN format and setupToken.';
      case ProvisionErrorType.BACKEND:
        return 'Server is experiencing issues. Try again later.';
      default:
        return 'Unknown error. Check logs for more details.';
    }
  }

  /**
   * Log de información general
   */
  info(message: string, context?: LogContext): void {
    this.log(ProvisionLogLevel.INFO, message, context);
  }

  /**
   * Log de debug (solo en desarrollo)
   */
  debug(message: string, context?: LogContext): void {
    if (__DEV__) {
      this.log(ProvisionLogLevel.DEBUG, message, context);
    }
  }

  /**
   * Log de advertencia
   */
  warn(message: string, context?: LogContext): void {
    this.log(ProvisionLogLevel.WARN, message, context);
  }

  /**
   * Log de error general
   */
  error(message: string, context?: LogContext): void {
    this.log(ProvisionLogLevel.ERROR, message, context);
  }
}

// Singleton instance
export const provisionLogger = new ProvisionLogger();

