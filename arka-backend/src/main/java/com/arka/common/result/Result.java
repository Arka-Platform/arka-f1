package com.arka.common.result;

import java.util.Objects;
import java.util.Optional;

public sealed interface Result<T> permits Result.Success, Result.Failure {

  record Success<T>(T value) implements Result<T> {
    public Success {
      Objects.requireNonNull(value, "value");
    }
  }

  record Failure<T>(String message, Throwable cause) implements Result<T> {
    public Failure {
      Objects.requireNonNull(message, "message");
    }

    public Optional<Throwable> cause() {
      return Optional.ofNullable(cause);
    }
  }

  static <T> Result<T> success(T value) {
    return new Success<>(value);
  }

  static <T> Result<T> failure(String message) {
    return new Failure<>(message, null);
  }

  static <T> Result<T> failure(String message, Throwable cause) {
    return new Failure<>(message, cause);
  }
}

