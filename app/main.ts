import * as net from 'net';
import fs from "node:fs";



const processArgs = process.argv.splice(2);

const directoryArgIndex = processArgs.findIndex(arg => arg.startsWith('--directory'));
const directoryArgValue = directoryArgIndex !== -1 ? processArgs[directoryArgIndex + 1] : undefined;

const server = net.createServer((socket) => {

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
        switch (true) {
            case path === "/":
                response = 'HTTP/1.1 200 OK\r\n\r\n';
                break;

            case path.startsWith("/echo/"):
                const echoPathQuery = path.split("/echo/")[1];
                response = `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${echoPathQuery.length}\r\n\r\n${echoPathQuery}`;
                break;

            case path === '/user-agent':
                const userAgent = headersMap.get('User-Agent');
                if (!userAgent) {
                    response = 'HTTP/1.1 400 Bad Request\r\n\r\n';
                    break;
                }
                response = `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${userAgent.length}\r\n\r\n${userAgent}`;
                break;

            case path.startsWith("/files/"):
                const fileName = path.split("/files/")[1];
                const filePath = directoryArgValue ? `${directoryArgValue}/${fileName}` : fileName;
                try {
                    const fileContent = fs.readFileSync(filePath);
                    response = `HTTP/1.1 200 OK\r\nContent-Type: application/octet-stream\r\nContent-Length: ${fileContent.length}\r\n\r\n${fileContent}`;
                } catch (error) {
                    response = 'HTTP/1.1 404 Not Found\r\n\r\n';
                }
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
