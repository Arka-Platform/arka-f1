package com.arka.modules.demand.entity;

public enum BookRequestStatus {
  OPEN,           // Request is open and looking for sellers
  FULFILLED,      // A seller has committed to fulfill this request
  COMPLETED,      // Request has been completed (book delivered)
  CANCELLED,      // Request was cancelled by requester
  EXPIRED         // Request expired (time limit reached)
}


