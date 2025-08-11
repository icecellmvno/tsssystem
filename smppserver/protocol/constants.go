package protocol

// SMPP Command IDs
const (
	// Generic NACK
	GENERIC_NACK = 0x80000000

	// Bind commands
	BIND_RECEIVER    = 0x00000001
	BIND_TRANSMITTER = 0x00000002
	BIND_TRANSCEIVER = 0x00000009

	// Bind response commands
	BIND_RECEIVER_RESP    = 0x80000001
	BIND_TRANSMITTER_RESP = 0x80000002
	BIND_TRANSCEIVER_RESP = 0x80000009

	// Outbind command
	OUTBIND = 0x0000000B

	// Unbind commands
	UNBIND      = 0x00000006
	UNBIND_RESP = 0x80000006

	// Submit commands
	SUBMIT_SM      = 0x00000004
	SUBMIT_SM_RESP = 0x80000004

	// Deliver commands
	DELIVER_SM      = 0x00000005
	DELIVER_SM_RESP = 0x80000005

	// Data commands
	DATA_SM      = 0x00000103
	DATA_SM_RESP = 0x80000103

	// Query commands
	QUERY_SM      = 0x00000003
	QUERY_SM_RESP = 0x80000003

	// Cancel commands
	CANCEL_SM      = 0x00000008
	CANCEL_SM_RESP = 0x80000008

	// Replace commands
	REPLACE_SM      = 0x00000007
	REPLACE_SM_RESP = 0x80000007

	// Enquire commands
	ENQUIRE_LINK      = 0x00000015
	ENQUIRE_LINK_RESP = 0x80000015

	// Alert commands
	ALERT_NOTIFICATION = 0x00000102
)

// SMPP Status Codes
const (
	ESME_ROK              = 0x00000000 // No Error
	ESME_RINVMSGLEN       = 0x00000001 // Message Length is invalid
	ESME_RINVCMDLEN       = 0x00000002 // Command Length is invalid
	ESME_RINVCMDID        = 0x00000003 // Invalid Command ID
	ESME_RINVBNDSTS       = 0x00000004 // Incorrect BIND Status for given command
	ESME_RALYBND          = 0x00000005 // ESME Already in Bound State
	ESME_RINVPRTFLG       = 0x00000006 // Invalid Priority Flag
	ESME_RINVREGDLVFLG    = 0x00000007 // Invalid Registered Delivery Flag
	ESME_RSYSERR          = 0x00000008 // System Error
	ESME_RINVSRCADR       = 0x0000000A // Invalid Source Address
	ESME_RINVDSTADR       = 0x0000000B // Invalid Destination Address
	ESME_RINVMSGID        = 0x0000000C // Message ID is invalid
	ESME_RBINDFAIL        = 0x0000000D // Bind Failed
	ESME_RINVPASWD        = 0x0000000E // Invalid Password
	ESME_RINVSYSID        = 0x0000000F // Invalid System ID
	ESME_RCANCELFAIL      = 0x00000011 // Cancel SM Failed
	ESME_RREPLACEFAIL     = 0x00000013 // Replace SM Failed
	ESME_RMSGQFUL         = 0x00000014 // Message Queue Full
	ESME_RINVSERTYP       = 0x00000015 // Invalid Service Type
	ESME_RINVNUMDESTS     = 0x00000033 // Invalid number of destinations
	ESME_RINVDLNAME       = 0x00000034 // Invalid Distribution List name
	ESME_RINVDESTFLAG     = 0x00000040 // Invalid Destination Flag
	ESME_RINVSUBREP       = 0x00000042 // Invalid 'Submit with Replace' request
	ESME_RINVESMCLASS     = 0x00000043 // Invalid esm_class field data
	ESME_RCNTSUBDL        = 0x00000044 // Cannot Submit to Distribution List
	ESME_RSUBMITFAIL      = 0x00000045 // submit_sm or data_sm failed
	ESME_RINVSRCTON       = 0x00000048 // Invalid Source address TON
	ESME_RINVSRCNPI       = 0x00000049 // Invalid Source address NPI
	ESME_RINVDSTTON       = 0x00000050 // Invalid Destination address TON
	ESME_RINVDSTNPI       = 0x00000051 // Invalid Destination address NPI
	ESME_RINVSYSTYP       = 0x00000053 // Invalid system_type field
	ESME_RINVREPFLAG      = 0x00000054 // Invalid replace_if_present flag
	ESME_RINVNUMMSGS      = 0x00000055 // Invalid number of messages
	ESME_RTHROTTLED       = 0x00000058 // Throttling error (ESME has exceeded allowed message limits)
	ESME_RINVSCHED        = 0x00000061 // Invalid Scheduled Delivery Time
	ESME_RINVEXPIRY       = 0x00000062 // Invalid message validity period (Expiry time)
	ESME_RINVDFTMSGID     = 0x00000063 // Predefined Message Invalid or Not Found
	ESME_RX_T_APPN        = 0x00000064 // ESME Receiver Temporary App Error Code n
	ESME_RX_P_APPN        = 0x00000065 // ESME Receiver Permanent App Error Code n
	ESME_RX_R_APPN        = 0x00000066 // ESME Receiver Reject Message Error Code n
	ESME_RQUERYFAIL       = 0x00000067 // query_sm request failed
	ESME_RINVOPTPARSTREAM = 0x000000C0 // Error in the optional part of the PDU Body
	ESME_ROPTPARNOTALLWD  = 0x000000C1 // Optional Parameter not allowed
	ESME_RINVPARLEN       = 0x000000C2 // Invalid Parameter Length
	ESME_RMISSINGOPTPARAM = 0x000000C3 // Expected Optional Parameter missing
	ESME_RINVOPTPARAMVAL  = 0x000000C4 // Invalid Optional Parameter Value
	ESME_RDELIVERYFAILURE = 0x000000FE // Delivery Failure (used for data_sm_resp)
	ESME_RUNKNOWNERR      = 0x000000FF // Unknown Error
)

// SMPP TON (Type of Number) values
const (
	TON_UNKNOWN           = 0x00
	TON_INTERNATIONAL     = 0x01
	TON_NATIONAL          = 0x02
	TON_NETWORK_SPECIFIC  = 0x03
	TON_SUBSCRIBER_NUMBER = 0x04
	TON_ALPHANUMERIC      = 0x05
	TON_ABBREVIATED       = 0x06
)

// SMPP NPI (Numbering Plan Indicator) values
const (
	NPI_UNKNOWN       = 0x00
	NPI_ISDN          = 0x01
	NPI_DATA          = 0x03
	NPI_TELEX         = 0x04
	NPI_LAND_MOBILE   = 0x06
	NPI_NATIONAL      = 0x08
	NPI_PRIVATE       = 0x09
	NPI_ERMES         = 0x0A
	NPI_INTERNET      = 0x0E
	NPI_WAP_CLIENT_ID = 0x12
)

// SMPP Data Coding Scheme values
const (
	DCS_GSM7   = 0x00
	DCS_8BIT   = 0x04
	DCS_UCS2   = 0x08
	DCS_LATIN1 = 0x03
)

// SMPP ESM Class values
const (
	ESM_CLASS_DEFAULT                = 0x00
	ESM_CLASS_DATAGRAM               = 0x01
	ESM_CLASS_FORWARD                = 0x02
	ESM_CLASS_STORE_AND_FORWARD      = 0x03
	ESM_CLASS_DATAGRAM_MODE          = 0x04
	ESM_CLASS_FORWARD_MODE           = 0x08
	ESM_CLASS_STORE_AND_FORWARD_MODE = 0x0C
)

// SMPP Registered Delivery values
const (
	REG_DELIVERY_NONE = 0x00
	REG_DELIVERY_SMSC = 0x01
	REG_DELIVERY_SME  = 0x02
	REG_DELIVERY_BOTH = 0x03
)

// SMPP Priority Flag values
const (
	PRIORITY_LEVEL_0 = 0x00
	PRIORITY_LEVEL_1 = 0x01
	PRIORITY_LEVEL_2 = 0x02
	PRIORITY_LEVEL_3 = 0x03
)

// SMPP Replace Flag values
const (
	REPLACE_IF_PRESENT_FALSE = 0x00
	REPLACE_IF_PRESENT_TRUE  = 0x01
)

// SMPP Optional Parameter Tags
const (
	OPT_PARAM_SAR_MSG_REF_NUM        = 0x020C // Concatenated short message reference number
	OPT_PARAM_SAR_TOTAL_SEGMENTS     = 0x020E // Total number of short messages in the concatenated short message
	OPT_PARAM_SAR_SEGMENT_SEQNUM     = 0x020F // Sequence number of the current short message within the concatenated short message
	OPT_PARAM_MESSAGE_PAYLOAD        = 0x0424 // Message payload
	OPT_PARAM_PRIVACY_INDICATOR      = 0x0201 // Privacy indicator
	OPT_PARAM_SOURCE_SUBADDRESS      = 0x0202 // Source subaddress
	OPT_PARAM_DEST_SUBADDRESS        = 0x0203 // Destination subaddress
	OPT_PARAM_USER_MESSAGE_REFERENCE = 0x0204 // User message reference
	OPT_PARAM_USER_RESPONSE_CODE     = 0x0205 // User response code
	OPT_PARAM_SOURCE_PORT            = 0x020A // Source port
	OPT_PARAM_DESTINATION_PORT       = 0x020B // Destination port
	OPT_PARAM_SAR_MSG_REF_NUM_8      = 0x020C // 8-bit concatenated short message reference number
	OPT_PARAM_SAR_TOTAL_SEGMENTS_8   = 0x020E // 8-bit total number of short messages
	OPT_PARAM_SAR_SEGMENT_SEQNUM_8   = 0x020F // 8-bit sequence number
	OPT_PARAM_MESSAGE_STATE          = 0x0427 // Message state (SMPP 3.4 standard)
	OPT_PARAM_RECEIPTED_MESSAGE_ID   = 0x001E // Receipted message ID
)
