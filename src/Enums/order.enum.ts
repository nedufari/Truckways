export enum PaymentStatus {
  SUCCESFUL = 'Successful',
  FAILED = 'Failed',
  PENDING = 'Pending',
}

export enum BidStatus {
  BID_SENT = 'Bid_sent',
  COUNTERED = 'Countered',
  BID_ACCEPTED = 'Bid_accepted',
  BID_DECLINED = 'Bid_declined',
}

export enum BidTypeAccepted {
  INITIAL = 'Initial',
  COUNTER = 'Counter',
 
}

export enum OrderStatus {
  COMPLETED = 'completed',
  ONGOING = 'ongoing',
  PENDING = 'pending',
}
