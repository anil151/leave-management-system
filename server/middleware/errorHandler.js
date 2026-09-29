const getValidationDetails = (error) => Object.fromEntries(
  Object.entries(error.errors || {}).map(([field, detail]) => [field, detail.message]),
);

const errorHandler = (error, _req, res, _next) => {
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Internal server error.';
  const response = { message };

  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed.';
    response.message = message;
    response.errors = getValidationDetails(error);
  } else if (error.name === 'CastError') {
    statusCode = 400;
    response.message = `Invalid ${error.path}.`;
  } else if (error.code === 11000) {
    statusCode = 400;
    response.message = 'A record with those unique values already exists.';
  } else if (error.type === 'entity.parse.failed') {
    statusCode = 400;
    response.message = 'Request body contains invalid JSON.';
  } else if (statusCode >= 500) {
    statusCode = 500;
    response.message = 'Internal server error.';
  }

  if (statusCode >= 500) {
    console.error(error);
  }

  res.status(statusCode).json(response);
};

export default errorHandler;
