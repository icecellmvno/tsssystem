package types

// DeliveryReportMessage represents the delivery report message structure
type DeliveryReportMessage struct {
	MessageID       string `json:"message_id"`
	SystemID        string `json:"system_id"`
	SourceAddr      string `json:"source_addr"`
	DestinationAddr string `json:"destination_addr"`
	MessageState    uint8  `json:"message_state"`
	ErrorCode       uint8  `json:"error_code"`
	FinalDate       string `json:"final_date"`
	SubmitDate      string `json:"submit_date"`
	DoneDate        string `json:"done_date"`
	Delivered       bool   `json:"delivered"`
	Failed          bool   `json:"failed"`
	FailureReason   string `json:"failure_reason,omitempty"`
	OriginalText    string `json:"original_text,omitempty"` // Orijinal SMS metni
}
