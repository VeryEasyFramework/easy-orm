/**
 * The PostgresConfig interface.
 * @remarks
 * This interface is used to define the configuration for a PostgreSQL database.
 *
 * @param data_directory (string) - The directory containing the database
 */
export type PostgresConfig = PGFileLocations & PGConnectionConfig;

/**
 * The default values of these variables are driven from the -D command-line
 * option or PGDATA environment variable, represented here as ConfigDir.
 */
interface PGFileLocations {
    /**
     * The directory containing the database
     * @example '/var/lib/postgresql/16/data'
     */
    data_directory: string;
    /**
     * Host-based authentication file
     * @example '/etc/postgresql/16/main/pg_hba.conf'
     */
    hba_file: string;
    /**
     * Ident configuration file
     * @example '/etc/postgresql/16/main/pg_ident.conf'
     */
    ident_file: string;
    /**
     * Write an extra PID file when starting up.
     * If external_pid_file is not explicitly set, no extra PID file is written.
     * @example '/var/run/postgresql/16-main.pid'
     */
    external_pid_file: string;
}


/**
 * CONNECTIONS
 */
interface PGConnectionConfig {
    /**
     * Specifies the TCP/IP address(es) on which the server is to listen for connections
     * from client applications. The value takes the form of a comma-separated list of
     * host names and/or numeric IP addresses.
     * The special entry * corresponds to all available IP interfaces.
     * The entry `0.0.0.0` allows listening for all IPv4 addresses and `::` allows listening for all IPv6 addresses.
     * If the list is empty, the server does not listen on any IP interface at all, in which case only Unix-domain
     * sockets can be used to connect to it. If the list is not empty, the server will start if it
     * can listen on at least one TCP/IP address. A warning will be emitted for any TCP/IP address which cannot be opened.
     * The default value is localhost, which allows only local TCP/IP “loopback” connections to be made.
     */
    listen_addresses: string;
    /**
     * The TCP port the server listens on; 5432 by default. Note that the same port number is used for all IP addresses the server listens on. This parameter can only be set at server start.
     */
    port: number;
    max_connections: number;
}
