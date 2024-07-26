//https://www.postgresql.org/docs/16/protocol-flow.html
//https://www.postgresql.org/docs/16/protocol-message-formats.html

import {pgErrorMap} from "./errorMap.ts";
import {PgError} from "./pgError.ts";

const decoder = new TextDecoder()
const decode = (data: Uint8Array) => decoder.decode(data)
const encoder = new TextEncoder()
const encode = (data: string) => encoder.encode(data)
const dataTypeMap = {
    16: 'bool',
    17: 'bytea',
    18: 'char',
    19: 'name',
    20: 'int8',
    21: 'int2',
    22: 'int2vector',
    23: 'int4',
    24: 'regproc',
    25: 'text',
    26: 'oid',
    27: 'tid',
    28: 'xid',
    29: 'cid',
    30: 'oidvector',
    114: 'json',
    142: 'xml',
}


function copy(src: Uint8Array, dst: Uint8Array, off = 0): number {
    off = Math.max(0, Math.min(off, dst.byteLength));
    const dstBytesAvailable = dst.byteLength - off;
    if (src.byteLength > dstBytesAvailable) {
        src = src.subarray(0, dstBytesAvailable);
    }
    dst.set(src, off);
    return src.byteLength;
}

function messageParser(data: Uint8Array) {
    let offset = 0
    while (offset < data.byteLength) {
        const firstByte = String.fromCharCode(data[offset])
        const messageLength = new DataView(data.buffer).getUint32(offset + 1, false)
        const message = data.slice(offset + 5, offset + messageLength + 1)

        console.log({firstByte})
        console.log({messageLength})
        // console.log({message})
        if (firstByte === 'S') {
            const paramLength = message.indexOf(0)
            console.log({paramLength})
            const param = message.slice(0, paramLength)
            const value = message.slice(paramLength + 1, message.byteLength - 1)
            console.log({param: decode(param)})
            console.log({value: decode(value)})
        }
        if (firstByte === 'R') {
            console.log('Authentication request')
        }
        if (firstByte === 'K') {
            console.log('Backend key data')

            const keyData = new DataView(message.buffer)
            const pid = keyData.getInt32(0, false)
            const key = keyData.getInt32(4, false)
            console.log({pid})
            console.log({key})

        }
        if (firstByte === 'Z') {
            console.log('Ready for query')
            const status = String.fromCharCode(message[0])
            console.log({status})
        }

        if (firstByte === 'E') {
            const errorMap = {
                'S': 'Severity',
                'C': 'Code',
                'V': 'SeverityLocal',
                'M': 'Message',
                'D': 'Detail',
                'H': 'Hint',
                'P': 'Position',
                'p': 'InternalPosition',
                'q': 'InternalQuery',
                'W': 'Where',
                's': 'SchemaName',
                't': 'TableName',
                'c': 'ColumnName',
                'd': 'DataTypeName',
                'n': 'ConstraintName',
                'F': 'File',
                'L': 'Line',
                'R': 'Routine',
            }

            const fields = decode(message).split('\0')
            const error = {}
            fields.forEach((field) => {

                const key = field[0]
                if (key) {

                    error[errorMap[key]] = field.slice(1)
                }
            })
            console.log({fields})
            console.log({error})
        }
        if (firstByte === 'T') {
            const columnCount = new DataView(message.buffer).getInt16(0, false)
            console.log({columnCount})
            let offset = 2
            for (let i = 0; i < columnCount; i++) {
                const columnLength = message.indexOf(0, offset)
                const column = message.slice(offset, columnLength)
                console.log({column: decode(column)})
                offset = columnLength + 1
            }
        }
        if (firstByte === 'D') {
            const columnCount = new DataView(message.buffer).getInt16(0, false)
            const columnLength = new DataView(message.buffer).getInt32(2, false)
            console.log({columnCount})
            console.log({columnLength})
            let offset = 6
            for (let i = 0; i < columnCount; i++) {
                const column = message.slice(offset, offset + columnLength)
                console.log({column: decode(column)})
                offset += columnLength
            }

        }
        offset += messageLength + 1
    }


}


interface ConnectionOptions {
    application_name?: string;
    client_encoding?: string;
    dateStyle?: string;
    TimeZone?: string;
}

interface ClientOptions {
    database: string,
    unixPath: string,
    password?: string,
    user: string,
    options?: Record<string, string>
}

type ClientMessageType = 'Q' | 'X' | 'B' | 'C' | 'f' | 'D' | 'E' | 'H' | 'F' | 'p' | 'P'
type ServerMessageType = 'S' | 'R' | 'Z' | 'E' | 'K'

class MessageReader {

    offset: number;
    size: number;
    headerBuffer: Uint8Array;
    currentMessage!: Uint8Array;
    messageType!: ServerMessageType;
    messageLength!: number;
    conn: Deno.Conn;


    decoder = new TextDecoder()

    constructor(conn: Deno.Conn) {
        this.offset = 0
        this.size = 1024

        this.conn = conn
        this.headerBuffer = new Uint8Array(5)
    }


    async nextMessage() {
        const res = await this.conn.read(this.headerBuffer)
        if (res === null) {
            return
        }
        this.messageType = decode(this.headerBuffer.slice(0, 1)) as ServerMessageType
        this.messageLength = new DataView(this.headerBuffer.buffer).getUint32(1, false)
        this.currentMessage = new Uint8Array(this.messageLength - 4)
        const res2 = await this.conn.read(this.currentMessage)
        this.offset = 0
        return res

    }


    decode(data: Uint8Array) {
        return this.decoder.decode(data)
    }

    getType() {

    }

    readByte() {
        return this.currentMessage[this.offset++]
    }

    readInt32() {
        const num = new DataView(this.currentMessage.buffer).getInt32(this.offset, false)
        this.offset += 4
        return num
    }

    readInt16() {
        const num = new DataView(this.currentMessage.buffer).getInt16(this.offset, false)
        this.offset += 2
        return num
    }

    readCString() {
        const start = this.offset
        const end = this.currentMessage.indexOf(0, start)
        const slice = this.currentMessage.slice(start, end)
        this.offset = end + 1
        return this.decode(slice)
    }

    readBytes(length: number) {
        const slice = this.currentMessage.slice(this.offset, this.offset + length)
        this.offset += length
        return slice
    }

    readChar() {
        const char = this.currentMessage[this.offset++]
        if (char === 0) {
            return null
        }
        return String.fromCharCode(char)
    }

    readString(length: number) {
        const bytes = this.currentMessage.slice(this.offset, this.offset + length)
        this.offset += length
        return this.decode(bytes)
    }

    readAllBytes() {
        const slice = this.currentMessage.slice(this.offset)
        this.offset = this.currentMessage.length
        return slice
    }

}

class MessageWriter {
    buffer: Uint8Array;
    offset: number;
    size: number;
    messageType: ClientMessageType | undefined;

    constructor(messageType?: ClientMessageType) {
        this.size = 1024;
        this.offset = 5;


        this.buffer = new Uint8Array(this.size);
        this.setMessageType(messageType)

    }

    setMessageType(type?: ClientMessageType) {
        this.messageType = type
        if (this.messageType) {

            this.buffer[0] = encode(this.messageType)[0]
        } else {
            this.buffer[0] = 0
        }
    }

    ensure(size: number) {
        const remaining = this.buffer.length - this.offset;
        if (remaining < size) {
            const oldBuffer = this.buffer;
            // exponential growth factor of around ~ 1.5
            // https://stackoverflow.com/questions/2269063/#buffer-growth-strategy
            const newSize = oldBuffer.length + (oldBuffer.length >> 1) + size;
            this.buffer = new Uint8Array(newSize);
            copy(oldBuffer, this.buffer);
        }
    }

    addCString(string?: string) {
        // just write a 0 for empty or null strings
        if (!string) {
            this.ensure(1);
        } else {
            const encodedStr = encoder.encode(string);
            this.ensure(encodedStr.byteLength + 1); // +1 for null terminator
            copy(encodedStr, this.buffer, this.offset);
            this.offset += encodedStr.byteLength;
        }

        this.buffer[this.offset++] = 0; // null terminator
        return this;
    }

    addInt32(num: number) {
        this.ensure(4);
        this.buffer[this.offset++] = (num >>> 24) & 0xff;
        this.buffer[this.offset++] = (num >>> 16) & 0xff;
        this.buffer[this.offset++] = (num >>> 8) & 0xff;
        this.buffer[this.offset++] = (num >>> 0) & 0xff;
        return this;
    }

    addInt16(num: number) {
        this.ensure(2);
        this.buffer[this.offset++] = (num >>> 8) & 0xff;
        this.buffer[this.offset++] = (num >>> 0) & 0xff;
        return this;
    }

    setSize() {
        const size = this.offset - 1;
        const dataView = new DataView(this.buffer.buffer);
        dataView.setInt32(1, size, false);
    }

    get message() {
        this.setSize()
        const withType = this.messageType ? 0 : 1
        const data = this.buffer.slice(withType, this.offset)
        this.reset()
        return data
    }

    reset() {
        this.offset = 5
    }


}

type ServerStatus = 'idle' | 'transaction' | 'error' | 'notConnected' | 'unknown'
type SimpleQueryResponseType =
    'CommandComplete'
    | 'CopyInResponse'
    | 'CopyOutResponse'
    | 'RowDescription'
    | 'DataRow'
    | 'EmptyQueryResponse'
    | 'ErrorResponse'
    | 'ReadyForQuery'
    | 'NoticeResponse'

type SimpleQueryResponse = {
    'C': 'CommandComplete',
    'G': 'CopyInResponse',
    'H': 'CopyOutResponse',
    'T': 'RowDescription',
    'D': 'DataRow',
    'I': 'EmptyQueryResponse',
    'E': 'ErrorResponse',
    'Z': 'ReadyForQuery',
    'N': 'NoticeResponse'

}

const statusMap: Record<any, ServerStatus> = {
    'I': 'idle',
    'T': 'transaction',
    'E': 'error'
}

const parseRowDescription = (reader: MessageReader) => {
    const columnCount = reader.readInt16()

    const columns = []
    for (let i = 0; i < columnCount; i++) {

        const name = reader.readCString()
        const tableId = reader.readInt32()
        const columnId = reader.readInt16()
        const dataTypeId = reader.readInt32()
        const dataTypeSize = reader.readInt16()
        const dataTypeModifier = reader.readInt32()
        const format = reader.readInt16()
        const column = {
            name,
            tableId,
            columnId,
            dataTypeId,
            dataTypeSize,
            dataTypeModifier,
            format
        }
        columns.push(column)

    }
    return columns

}

export class PostgresClient {
    conn!: Deno.Conn;
    connectionParams: ClientOptions;
    serverParams: Record<string, string>;

    private readonly writer: MessageWriter;
    private reader!: MessageReader;
    serverStatus: ServerStatus;
    status: 'connected' | 'notConnected' = 'notConnected'


    constructor(options: ClientOptions) {
        this.connectionParams = options;
        this.writer = new MessageWriter()
        this.serverParams = {}
        this.serverStatus = 'notConnected'

    }

    async readResponseHeader() {
        const buffer = new Uint8Array(5)
        await this.conn.read(buffer)

    }

    async connect() {
        this.conn = await Deno.connect({
            path: this.connectionParams.unixPath,
            transport: "unix"
        });
        this.reader = new MessageReader(this.conn)
        const writer = this.writer
        writer.addInt32(196608)
        writer.addCString('user')
        writer.addCString(this.connectionParams.user)
        writer.addCString('database')
        writer.addCString(this.connectionParams.database)
        if (this.connectionParams.options) {
            for (const [key, value] of Object.entries(this.connectionParams.options)) {
                writer.addCString(key)
                writer.addCString(value)
            }
        }
        writer.addCString('')
        await this.conn.write(writer.message)
        // const data = await reader(this.conn)
        // messageParser(data)
        // return

        while (this.status !== 'connected') {

            const readCount = await this.reader.nextMessage()
            switch (this.reader.messageType) {
                case "R": {

                    const authType = this.reader.readInt32()

                    break
                }
                case "S": {

                    const param = this.reader.readCString()
                    this.serverParams[param] = this.reader.readCString()

                    break
                }
                case "Z": {
                    this.status = 'connected'
                    const status = this.reader.readString(1) as 'I' | 'T' | 'E'

                    this.serverStatus = statusMap[status]

                    break
                }
                case "E": {

                    const error = this.reader.readCString()
                    console.log({error})
                    break
                }
            }

        }

        console.log('Connected')

    }

    async read() {

    }

    async query(query: string) {
        console.log({query})
        const writer = this.writer
        writer.setMessageType('Q')
        writer.addCString(query)
        await this.conn.write(writer.message)
        let status;
        const fields = []
        const data: Record<string, any>[] = []
        const reader = this.reader
        while (!status) {
            const readCount = await reader.nextMessage()
            const messageType = reader.messageType as keyof SimpleQueryResponse

            switch (messageType) {
                case "T": {
                    const columns = parseRowDescription(reader)
                    fields.push(...columns)
                    break
                }
                case "D": {
                    const columnCount = reader.readInt16()
                    console.log({columnCount})
                    const row: Record<string, any> = {}
                    for (let i = 0; i < columnCount; i++) {
                        const field = fields[i]

                        const length = reader.readInt32() //
                        console.log({length})
                        if (length === -1) {
                            row[field.name] = null
                            continue
                        }
                        const column = reader.readBytes(length)
                        row[fields[i].name] = decode(column)
                    }
                    data.push(row)
                    break
                }
                case "Z": {
                    const serverStatus = this.reader.readString(1) as 'I' | 'T' | 'E'
                    this.serverStatus = statusMap[serverStatus]
                    status = 'done'
                    break
                }
                case "E": {
                    const errorMap = {
                        'S': 'severity',
                        'C': 'code',
                        'V': 'severityLocal',
                        'M': 'message',
                        'D': 'detail',
                        'H': 'hint',
                        'P': 'position',
                        'p': 'internalPosition',
                        'q': 'internalQuery',
                        'W': 'where',
                        's': 'schemaName',
                        't': 'tableName',
                        'c': 'columnName',
                        'd': 'dataTypeName',
                        'n': 'constraintName',
                        'F': 'file',
                        'L': 'line',
                        'R': 'routine',
                    }
                    const errorFields: Record<string, any> = {}
                    let offset = 0
                    while (reader.offset < reader.messageLength) {

                        const field = reader.readChar() as keyof typeof errorMap | null
                        if (!field) {
                            break
                        }
                        const value = reader.readCString()

                        errorFields[errorMap[field]] = value
                        offset++
                        if (offset > reader.messageLength) {
                            break
                        }

                    }
                    console.log({errorFields})
                    errorFields['name'] = pgErrorMap[errorFields['code'] as keyof typeof pgErrorMap]
                    throw new PgError(errorFields)
                    break
                }
            }
        }
        console.log({fields})
        console.log({data})
        return data
    }
}

if (import.meta.main) {
    const client = new PostgresClient({
        database: 'irl',
        unixPath: '/var/run/postgresql/.s.PGSQL.5432',
        user: 'eliveffer',
        options: {
            'client_encoding': 'UTF8',
            'application_name': 'deno-postgres',
        }
    })
    await client.connect()
    const query = 'SELECT * FROM irl_app."user";'
    await client.query(query)
}

