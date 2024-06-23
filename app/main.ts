import * as net from 'net';

const server = net.createServer((socket) => {
    
    // socket.write(Buffer.from('HTTP/1.1 200 OK\r\n\r\n'));
    // socket.end();
    socket.on('data', (data)=>{
        const request = data.toString();
        const path = request.split(' ')[1];
        const headersStringArray = request.split('\r\n').slice(1, -2);
        const headersKeyValueArray: [string, string][] = headersStringArray.map(headerString => {
            const [key, _ ] = headerString.split(': ');
            const value = headerString.split(': ')[1];
            return [ key, value ];
        });
        const headersMap = new Map(headersKeyValueArray);


        let response;

        // Example: "GET /echo/abc HTTP/1.1\r\nHost: localhost:4221\r\nUser-Agent: curl/7.64.1\r\nAccept: */*\r\n\r\n"
        const echoPath = '/echo';
        const echoPathQuery = path.split(echoPath + "/")[1];

        const userAgentPath = '/user-agent';

        switch (path) {
            case "/":
                response = 'HTTP/1.1 200 OK\r\n\r\n';
                break;
            case `${echoPath}/${echoPathQuery}`:
                response = `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${echoPathQuery.length}\r\n\r\n${echoPathQuery}`;
                break;
            case userAgentPath:
                const userAgent = headersMap.get('User-Agent');
                if (!userAgent) {
                    response = 'HTTP/1.1 400 Bad Request\r\n\r\n';
                    break;
                }
                response = `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${userAgent.length}\r\n\r\n${userAgent}`;
                break;
            default:
                response = 'HTTP/1.1 404 Not Found\r\n\r\n';
                break;
        }

        socket.write(response);
        socket.end(); 
    })
});

// You can use print statements as follows for debugging, they'll be visible when running tests.
console.log("Logs from your program will appear here!");

// Uncomment this to pass the first stage
server.listen(4221, 'localhost', () => {
    console.log('Server is running on port 4221');
});
