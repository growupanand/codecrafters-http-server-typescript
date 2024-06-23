import * as net from 'net';
import fs from "node:fs";



const processArgs = process.argv.splice(2);

const directoryArgIndex = processArgs.findIndex(arg => arg.startsWith('--directory'));
const directoryArgValue = directoryArgIndex !== -1 ? processArgs[directoryArgIndex + 1] : undefined;

const server = net.createServer((socket) => {

    socket.on('data', (data)=>{
        const requestString = data.toString();
        const requestLines = requestString.split('\r\n');
        const [method, path, _] = requestLines[0].split(' ');
        const requestBody = requestLines.pop();

        const headersStringArray = requestLines.slice(1);
        const headersKeyValueArray: [string, string][] = headersStringArray.map(headerString => {
            const [key, _ ] = headerString.split(': ');
            const value = headerString.split(': ')[1];
            return [ key, value ];
        });
        const headersMap = new Map(headersKeyValueArray);

        
        let response = 'HTTP/1.1 404 Not Found\r\n\r\n';
        switch (true) {
            case path === "/":
                response = 'HTTP/1.1 200 OK\r\n\r\n';
                break;

            // Example: "GET /echo/abc HTTP/1.1\r\nHost: localhost:4221\r\nUser-Agent: curl/7.64.1\r\nAccept: */*\r\n\r\n"
            case path.startsWith("/echo/"):
                const echoPathQuery = path.split("/echo/")[1];
                response = `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${echoPathQuery.length}\r\n\r\n${echoPathQuery}`;
                break;

            case path === '/user-agent':
                console.log({headersMap, path});
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

                if (method === "GET") {
                    try {
                        const fileContent = fs.readFileSync(filePath);
                        response = `HTTP/1.1 200 OK\r\nContent-Type: application/octet-stream\r\nContent-Length: ${fileContent.length}\r\n\r\n${fileContent}`;
                    } catch (error) {}
                }
                
                if (method === "POST" && requestBody !== undefined) {
                    try {
                        // Create new file with content of request body
                        fs.writeFileSync(filePath, requestBody);
                        response = 'HTTP/1.1 201 Created\r\n\r\n';
                    } catch (error) {}
                }

                break;

            default:
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
