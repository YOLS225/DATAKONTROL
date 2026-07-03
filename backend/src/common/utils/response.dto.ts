export interface Response<T> {
  data?: T;
  success?: boolean;
  message?: string;
}

export function fail<T>(
  data: T,
  success?: false,
  message?: string,
): Response<T> {
  return { data, success, message };
}

export function success<T>(
  data: T,
  success?: true,
  message?: string,
): Response<T> {
  return { data, success, message };
}
