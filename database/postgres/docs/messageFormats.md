This section describes the detailed format of each message. Each is marked to indicate that it can
be
sent by a frontend (F), a backend (B), or both (F & B). Notice that although each message includes a
2356
Frontend/Backend Protocol
byte count at the beginning, the message format is defined so that the message end can be found
without
reference to the byte count. This aids validity checking. (The CopyData message is an exception,
because it forms part of a data stream; the contents of any individual CopyData message cannot be
interpretable on their own.)

## AuthenticationOk (B)

Byte1('R')
Identifies the message as an authentication request.
Int32(8)
Length of message contents in bytes, including self.
Int32(0)
Specifies that the authentication was successful.

## AuthenticationKerberosV5 (B)

Byte1('R')
Identifies the message as an authentication request.
Int32(8)
Length of message contents in bytes, including self.
Int32(2)
Specifies that Kerberos V5 authentication is required.

## AuthenticationCleartextPassword (B)

Byte1('R')
Identifies the message as an authentication request.
Int32(8)
Length of message contents in bytes, including self.
Int32(3)
Specifies that a clear-text password is required.

## AuthenticationMD5Password (B)

Byte1('R')
Identifies the message as an authentication request.
Int32(12)
Length of message contents in bytes, including self.
Int32(5)
Specifies that an MD5-encrypted password is required.
Byte4
The salt to use when encrypting the password.
2357
Frontend/Backend Protocol

## AuthenticationGSS (B)

Byte1('R')
Identifies the message as an authentication request.
Int32(8)
Length of message contents in bytes, including self.
Int32(7)
Specifies that GSSAPI authentication is required.

## AuthenticationGSSContinue (B)

Byte1('R')
Identifies the message as an authentication request.
Int32
Length of message contents in bytes, including self.
Int32(8)
Specifies that this message contains GSSAPI or SSPI data.
Byten
GSSAPI or SSPI authentication data.

## AuthenticationSSPI (B)

Byte1('R')
Identifies the message as an authentication request.
Int32(8)
Length of message contents in bytes, including self.
Int32(9)
Specifies that SSPI authentication is required.

## AuthenticationSASL (B)

Byte1('R')
Identifies the message as an authentication request.
Int32
Length of message contents in bytes, including self.
Int32(10)
Specifies that SASL authentication is required.
The message body is a list of SASL authentication mechanisms, in the server's order of preference.
A zero byte is required as terminator after the last authentication mechanism name. For each
mechanism, there is the following:
2358
Frontend/Backend Protocol
String
Name of a SASL authentication mechanism.

## AuthenticationSASLContinue (B)

Byte1('R')
Identifies the message as an authentication request.
Int32
Length of message contents in bytes, including self.
Int32(11)
Specifies that this message contains a SASL challenge.
Byten
SASL data, specific to the SASL mechanism being used.

## AuthenticationSASLFinal (B)

Byte1('R')
Identifies the message as an authentication request.
Int32
Length of message contents in bytes, including self.
Int32(12)
Specifies that SASL authentication has completed.
Byten
SASL outcome "additional data", specific to the SASL mechanism being used.

## BackendKeyData (B)

Byte1('K')
Identifies the message as cancellation key data. The frontend must save these values if it
wishes to be able to issue CancelRequest messages later.
Int32(12)
Length of message contents in bytes, including self.
Int32
The process ID of this backend.
Int32
The secret key of this backend.

## BindComplete (B)

Byte1('2')
Identifies the message as a Bind-complete indicator.
Int32(4)
Length of message contents in bytes, including self.
2360
Frontend/Backend Protocol

## CloseComplete (B)

Byte1('3')
Identifies the message as a Close-complete indicator.
Int32(4)
Length of message contents in bytes, including self.

## CommandComplete (B)

Byte1('C')
Identifies the message as a command-completed response.
Int32
Length of message contents in bytes, including self.
String
The command tag. This is usually a single word that identifies which SQL command was
completed.
2361
Frontend/Backend Protocol
For an INSERT command, the tag is INSERT oid rows, where rows is the number
of rows inserted. oid used to be the object ID of the inserted row if rows was 1 and the
target table had OIDs, but OIDs system columns are not supported anymore; therefore oid
is always 0.
For a DELETE command, the tag is DELETE rows where rows is the number of rows
deleted.
For an UPDATE command, the tag is UPDATE rows where rows is the number of rows
updated.
For a MERGE command, the tag is MERGE rows where rows is the number of rows inserted,
updated, or deleted.
For a SELECT or CREATE TABLE AS command, the tag is SELECT rows where rows
is the number of rows retrieved.
For a MOVE command, the tag is MOVE rows where rows is the number of rows the cursor's
position has been changed by.
For a FETCH command, the tag is FETCH rows where rows is the number of rows that
have been retrieved from the cursor.
For a COPY command, the tag is COPY rows where rows is the number of rows copied.
(Note: the row count appears only in PostgreSQL 8.2 and later.)
CopyData (F & B)
Byte1('d')
Identifies the message as COPY data.
Int32
Length of message contents in bytes, including self.
Byten
Data that forms part of a COPY data stream. Messages sent from the backend will always
correspond to single data rows, but messages sent by frontends might divide the data stream
arbitrarily.
CopyDone (F & B)
Byte1('c')
Identifies the message as a COPY-complete indicator.
Int32(4)
Length of message contents in bytes, including self.

## CopyInResponse (B)

Byte1('G')
Identifies the message as a Start Copy In response. The frontend must now send copy-in data
(if not prepared to do so, send a CopyFail message).
Int32
Length of message contents in bytes, including self.
Int8
0 indicates the overall COPY format is textual (rows separated by newlines, columns separated by
separator characters, etc.). 1 indicates the overall copy format is binary (similar to
DataRow format). See COPY for more information.
Int16
The number of columns in the data to be copied (denoted N below).
Int16[N]
The format codes to be used for each column. Each must presently be zero (text) or one
(binary). All must be zero if the overall copy format is textual.

## CopyOutResponse (B)

Byte1('H')
Identifies the message as a Start Copy Out response. This message will be followed by copyout data.
Int32
Length of message contents in bytes, including self.
Int8
0 indicates the overall COPY format is textual (rows separated by newlines, columns separated by
separator characters, etc.). 1 indicates the overall copy format is binary (similar to
DataRow format). See COPY for more information.
Int16
The number of columns in the data to be copied (denoted N below).
Int16[N]
The format codes to be used for each column. Each must presently be zero (text) or one
(binary). All must be zero if the overall copy format is textual.

## CopyBothResponse (B)

Byte1('W')
Identifies the message as a Start Copy Both response. This message is used only for Streaming
Replication.
2363
Frontend/Backend Protocol
Int32
Length of message contents in bytes, including self.
Int8
0 indicates the overall COPY format is textual (rows separated by newlines, columns separated by
separator characters, etc.). 1 indicates the overall copy format is binary (similar to
DataRow format). See COPY for more information.
Int16
The number of columns in the data to be copied (denoted N below).
Int16[N]
The format codes to be used for each column. Each must presently be zero (text) or one
(binary). All must be zero if the overall copy format is textual.

## DataRow (B)

Byte1('D')
Identifies the message as a data row.
Int32
Length of message contents in bytes, including self.
Int16
The number of column values that follow (possibly zero).
Next, the following pair of fields appear for each column:
Int32
The length of the column value, in bytes (this count does not include itself). Can be zero. As
a special case, -1 indicates a NULL column value. No value bytes follow in the NULL case.
Byten
The value of the column, in the format indicated by the associated format code. n is the above
length.

## EmptyQueryResponse (B)

Byte1('I')
Identifies the message as a response to an empty query string. (This substitutes for
CommandComplete.)
Int32(4)
Length of message contents in bytes, including self.

## ErrorResponse (B)

Byte1('E')
Identifies the message as an error.
Int32
Length of message contents in bytes, including self.
The message body consists of one or more identified fields, followed by a zero byte as a
terminator. Fields can appear in any order. For each field there is the following:
Byte1
A code identifying the field type; if zero, this is the message terminator and no string follows.
The presently defined field types are listed in Section 55.8. Since more field types might be
added in future, frontends should silently ignore fields of unrecognized type.
String
The field value.

## FunctionCallResponse (B)

Byte1('V')
Identifies the message as a function call result.
Int32
Length of message contents in bytes, including self.
Int32
The length of the function result value, in bytes (this count does not include itself). Can be
zero. As a special case, -1 indicates a NULL function result. No value bytes follow in the
NULL case.
2366
Frontend/Backend Protocol
Byten
The value of the function result, in the format indicated by the associated format code. n is
the above length.

## NegotiateProtocolVersion (B)

Byte1('v')
Identifies the message as a protocol version negotiation message.
Int32
Length of message contents in bytes, including self.
Int32
Newest minor protocol version supported by the server for the major protocol version requested by
the client.
Int32
Number of protocol options not recognized by the server.
Then, for protocol option not recognized by the server, there is the following:
String
The option name.

## NoData (B)

Byte1('n')
Identifies the message as a no-data indicator.
2367
Frontend/Backend Protocol
Int32(4)
Length of message contents in bytes, including self.

## NoticeResponse (B)

Byte1('N')
Identifies the message as a notice.
Int32
Length of message contents in bytes, including self.
The message body consists of one or more identified fields, followed by a zero byte as a
terminator. Fields can appear in any order. For each field there is the following:
Byte1
A code identifying the field type; if zero, this is the message terminator and no string follows.
The presently defined field types are listed in Section 55.8. Since more field types might be
added in future, frontends should silently ignore fields of unrecognized type.
String
The field value.

## NotificationResponse (B)

Byte1('A')
Identifies the message as a notification response.
Int32
Length of message contents in bytes, including self.
Int32
The process ID of the notifying backend process.
String
The name of the channel that the notify has been raised on.
String
The “payload” string passed from the notifying process.

## ParameterDescription (B)

Byte1('t')
Identifies the message as a parameter description.
Int32
Length of message contents in bytes, including self.
Int16
The number of parameters used by the statement (can be zero).
Then, for each parameter, there is the following:
2368
Frontend/Backend Protocol
Int32
Specifies the object ID of the parameter data type.

## ParameterStatus (B)

Byte1('S')
Identifies the message as a run-time parameter status report.
Int32
Length of message contents in bytes, including self.
String
The name of the run-time parameter being reported.
String
The current value of the parameter.

## ParseComplete (B)

Byte1('1')
Identifies the message as a Parse-complete indicator.
Int32(4)
Length of message contents in bytes, including self.
2369
Frontend/Backend Protocol

## PortalSuspended (B)

Byte1('s')
Identifies the message as a portal-suspended indicator. Note this only appears if an Execute
message's row-count limit was reached.
Int32(4)
Length of message contents in bytes, including self.

## ReadyForQuery (B)

Byte1('Z')
Identifies the message type. ReadyForQuery is sent whenever the backend is ready for a new
query cycle.
Int32(5)
Length of message contents in bytes, including self.
Byte1
Current backend transaction status indicator. Possible values are 'I' if idle (not in a transaction
block); 'T' if in a transaction block; or 'E' if in a failed transaction block (queries will be
rejected until block is ended).

## RowDescription (B)

Byte1('T')
Identifies the message as a row description.
2370
Frontend/Backend Protocol
Int32
Length of message contents in bytes, including self.
Int16
Specifies the number of fields in a row (can be zero).
Then, for each field, there is the following:
String
The field name.
Int32
If the field can be identified as a column of a specific table, the object ID of the table;
otherwise zero.
Int16
If the field can be identified as a column of a specific table, the attribute number of the
column; otherwise zero.
Int32
The object ID of the field's data type.
Int16
The data type size (see pg_type.typlen). Note that negative values denote variable-width types.
Int32
The type modifier (see pg_attribute.atttypmod). The meaning of the modifier is
type-specific.
Int16
The format code being used for the field. Currently will be zero (text) or one (binary). In a
RowDescription returned from the statement variant of Describe, the format code is not yet
known and will always be zero.


