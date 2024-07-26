## Sync (F)

### Byte1('S')

Identifies the message as a Sync command.

### Int32(4)

Length of message contents in bytes, including self.

## Terminate (F)

Byte1('X')
Identifies the message as a termination.
Int32(4)
Length of message contents in bytes, including self.

## Bind (F)

Byte1('B')
Identifies the message as a Bind command.
2359
Frontend/Backend Protocol
Int32
Length of message contents in bytes, including self.
String
The name of the destination portal (an empty string selects the unnamed portal).
String
The name of the source prepared statement (an empty string selects the unnamed prepared
statement).
Int16
The number of parameter format codes that follow (denoted C below). This can be zero to
indicate that there are no parameters or that the parameters all use the default format (text);
or one, in which case the specified format code is applied to all parameters; or it can equal
the actual number of parameters.
Int16[C]
The parameter format codes. Each must presently be zero (text) or one (binary).
Int16
The number of parameter values that follow (possibly zero). This must match the number of
parameters needed by the query.
Next, the following pair of fields appear for each parameter:
Int32
The length of the parameter value, in bytes (this count does not include itself). Can be zero.
As a special case, -1 indicates a NULL parameter value. No value bytes follow in the NULL
case.
Byten
The value of the parameter, in the format indicated by the associated format code. n is the
above length.
After the last parameter, the following fields appear:
Int16
The number of result-column format codes that follow (denoted R below). This can be zero to
indicate that there are no result columns or that the result columns should all use the default
format (text); or one, in which case the specified format code is applied to all result columns
(if any); or it can equal the actual number of result columns of the query.
Int16[R]
The result-column format codes. Each must presently be zero (text) or one (binary).

## CancelRequest (F)

Int32(16)
Length of message contents in bytes, including self.
Int32(80877102)
The cancel request code. The value is chosen to contain 1234 in the most significant 16 bits,
and 5678 in the least significant 16 bits. (To avoid confusion, this code must not be the same
as any protocol version number.)
Int32
The process ID of the target backend.
Int32
The secret key for the target backend.

## Close (F)

Byte1('C')
Identifies the message as a Close command.
Int32
Length of message contents in bytes, including self.
Byte1
'S' to close a prepared statement; or 'P' to close a portal.
String
The name of the prepared statement or portal to close (an empty string selects the unnamed
prepared statement or portal).

## CopyFail (F)

Byte1('f')
Identifies the message as a COPY-failure indicator.
Int32
Length of message contents in bytes, including self.
2362
Frontend/Backend Protocol
String
An error message to report as the cause of failure.

## Describe (F)

Byte1('D')
Identifies the message as a Describe command.
Int32
Length of message contents in bytes, including self.
Byte1
'S' to describe a prepared statement; or 'P' to describe a portal.
String
The name of the prepared statement or portal to describe (an empty string selects the unnamed
prepared statement or portal).
2364
Frontend/Backend Protocol

## Execute (F)

Byte1('E')
Identifies the message as an Execute command.
Int32
Length of message contents in bytes, including self.
String
The name of the portal to execute (an empty string selects the unnamed portal).
Int32
Maximum number of rows to return, if portal contains a query that returns rows (ignored
otherwise). Zero denotes “no limit”.

## Flush (F)

Byte1('H')
Identifies the message as a Flush command.
Int32(4)
Length of message contents in bytes, including self.
2365
Frontend/Backend Protocol

## FunctionCall (F)

Byte1('F')
Identifies the message as a function call.
Int32
Length of message contents in bytes, including self.
Int32
Specifies the object ID of the function to call.
Int16
The number of argument format codes that follow (denoted C below). This can be zero to
indicate that there are no arguments or that the arguments all use the default format (text);
or one, in which case the specified format code is applied to all arguments; or it can equal
the actual number of arguments.
Int16[C]
The argument format codes. Each must presently be zero (text) or one (binary).
Int16
Specifies the number of arguments being supplied to the function.
Next, the following pair of fields appear for each argument:
Int32
The length of the argument value, in bytes (this count does not include itself). Can be zero. As
a special case, -1 indicates a NULL argument value. No value bytes follow in the NULL case.
Byten
The value of the argument, in the format indicated by the associated format code. n is the
above length.
After the last argument, the following field appears:
Int16
The format code for the function result. Must presently be zero (text) or one (binary).

## GSSENCRequest (F)

Int32(8)
Length of message contents in bytes, including self.
Int32(80877104)
The GSSAPI Encryption request code. The value is chosen to contain 1234 in the most
significant 16 bits, and 5680 in the least significant 16 bits. (To avoid confusion, this code
must not be the same as any protocol version number.)

## GSSResponse (F)

Byte1('p')
Identifies the message as a GSSAPI or SSPI response. Note that this is also used for SASL
and password response messages. The exact message type can be deduced from the context.
Int32
Length of message contents in bytes, including self.
Byten
GSSAPI/SSPI specific message data.

## Parse (F)

Byte1('P')
Identifies the message as a Parse command.
Int32
Length of message contents in bytes, including self.
String
The name of the destination prepared statement (an empty string selects the unnamed prepared
statement).
String
The query string to be parsed.
Int16
The number of parameter data types specified (can be zero). Note that this is not an indication
of the number of parameters that might appear in the query string, only the number that the
frontend wants to prespecify types for.
Then, for each parameter, there is the following:
Int32
Specifies the object ID of the parameter data type. Placing a zero here is equivalent to leaving
the type unspecified.

## PasswordMessage (F)

Byte1('p')
Identifies the message as a password response. Note that this is also used for GSSAPI, SSPI
and SASL response messages. The exact message type can be deduced from the context.
Int32
Length of message contents in bytes, including self.
String
The password (encrypted, if requested).

## Query (F)

Byte1('Q')
Identifies the message as a simple query.
Int32
Length of message contents in bytes, including self.
String
The query string itself.

## SSLRequest (F)

Int32(8)
Length of message contents in bytes, including self.
Int32(80877103)
The SSL request code. The value is chosen to contain 1234 in the most significant 16 bits,
and 5679 in the least significant 16 bits. (To avoid confusion, this code must not be the same
as any protocol version number.)

## SASLResponse (F)

Byte1('p')
Identifies the message as a SASL response. Note that this is also used for GSSAPI, SSPI and
password response messages. The exact message type can be deduced from the context.
Int32
Length of message contents in bytes, including self.
Byten
SASL mechanism specific message data.

## StartupMessage (F)

Int32
Length of message contents in bytes, including self.
Int32(196608)
The protocol version number. The most significant 16 bits are the major version number (3
for the protocol described here). The least significant 16 bits are the minor version number
(0 for the protocol described here).
The protocol version number is followed by one or more pairs of parameter name and value
strings. A zero byte is required as a terminator after the last name/value pair. Parameters can
appear in any order. user is required, others are optional. Each parameter is specified as:
String
The parameter name. Currently recognized names are:
user
The database user name to connect as. Required; there is no default.
database
The database to connect to. Defaults to the user name.
options
Command-line arguments for the backend. (This is deprecated in favor of setting individual run-time
parameters.) Spaces within this string are considered to separate arguments, unless escaped with a
backslash (\); write \\ to represent a literal backslash.
2372
Frontend/Backend Protocol
replication
Used to connect in streaming replication mode, where a small set of replication commands can be
issued instead of SQL statements. Value can be true, false, or database, and the default is false.
See Section 55.4 for details.
In addition to the above, other parameters may be listed. Parameter names beginning with
_pq_. are reserved for use as protocol extensions, while others are treated as run-time parameters
to be set at backend start time. Such settings will be applied during backend start
(after parsing the command-line arguments if any) and will act as session defaults.
String
The parameter value.

## SASLInitialResponse (F)

Byte1('p')
Identifies the message as an initial SASL response. Note that this is also used for GSSAPI,
SSPI and password response messages. The exact message type is deduced from the context.
Int32
Length of message contents in bytes, including self.
String
Name of the SASL authentication mechanism that the client selected.
Int32
Length of SASL mechanism specific "Initial Client Response" that follows, or -1 if there is
no Initial Response.
2371
Frontend/Backend Protocol
Byten
SASL mechanism specific "Initial Response".
