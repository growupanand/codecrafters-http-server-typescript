import * as net from 'net';
import fs from "node:fs";


const supportedCompressions = ['gzip'];


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



        const responseBuilder = new HttpResponseBuilder();

        const acceptEncoding = headersMap.get('Accept-Encoding');
        if (acceptEncoding) {
            const acceptEncodingList = acceptEncoding.split(',').map(i => i.trim());
            const supportedCompressionsList = supportedCompressions.filter(i => acceptEncodingList.includes(i));
            if (supportedCompressionsList.length > 0) {
                responseBuilder
                    .addHeader('Content-Encoding', supportedCompressionsList[0])
            }
        }

        switch (true) {
            case path === "/":
                responseBuilder.setStatusCode(200);
                break;

            // Example: "GET /echo/abc HTTP/1.1\r\nHost: localhost:4221\r\nUser-Agent: curl/7.64.1\r\nAccept: */*\r\n\r\n"
            case path.startsWith("/echo/"):
                const echoPathQuery = path.split("/echo/")[1];
                responseBuilder
                    .setStatusCode(200)
                    .addHeader('Content-Type', 'text/plain')
                    .addHeader('Content-Length', echoPathQuery.length.toString())
                    .setBody(echoPathQuery);
                break;

            case path === '/user-agent':
                const userAgent = headersMap.get('User-Agent');
                if (!userAgent) {
                    responseBuilder.setStatusCode(400);
                    break;
                }

                responseBuilder
                    .setStatusCode(200)
                    .addHeader('Content-Type', 'text/plain')
                    .addHeader('Content-Length', userAgent.length.toString())
                    .setBody(userAgent);
                break;

            case path.startsWith("/files/"):
                const fileName = path.split("/files/")[1];
                const filePath = directoryArgValue ? `${directoryArgValue}/${fileName}` : fileName;

                if (method === "GET") {
                    try {
                        const fileContent = fs.readFileSync(filePath);
                        responseBuilder
                            .setStatusCode(200)
                            .addHeader('Content-Type', 'application/octet-stream')
                            .addHeader('Content-Length', fileContent.length.toString())
                            .setBody(fileContent.toString());
                    } catch (error) {
                        responseBuilder.setStatusCode(404);
                        responseBuilder.setStatusText('Not Found');
                    }
                }
                
                if (method === "POST" && requestBody !== undefined) {
                    try {
                        // Create new file with content of request body
                        fs.writeFileSync(filePath, requestBody);
                        responseBuilder.setStatusCode(201);
                        responseBuilder.setStatusText('Created');
                    } catch (error) {
                        responseBuilder.setStatusCode(404);
                        responseBuilder.setStatusText('Not Found');
                    }
                }

                break;

            default:
                responseBuilder.setStatusCode(404);
                responseBuilder.setStatusText('Not Found');
                break;
        }


        socket.write(responseBuilder.build());
        socket.end(); 
    })
});




class HttpResponseBuilder {
    private statusCode: number = 200;
    private statusText: string = 'OK';
    private headersMap: Map<string, string> = new Map();
    private body: string = '';

    setStatusCode(statusCode: number) {
        this.statusCode = statusCode;
        return this;
    }

    setStatusText(statusText: string) {
        this.statusText = statusText;
        return this;
    }

    addHeader(key: string, value: string) {
        this.headersMap.set(key, value);
        return this;
    }

    setBody(body: string) {
        this.body = body;
        return this;
    }

    build() {
        const headers = Array.from(this.headersMap.entries()).map(([key, value]) => `${key}: ${value}`).join('\r\n');
        return `HTTP/1.1 ${this.statusCode} ${this.statusText}\r\n${headers}\r\n\r\n${this.body}`;
    }
}




// You can use print statements as follows for debugging, they'll be visible when running tests.
console.log("Logs from your program will appear here!");

// Uncomment this to pass the first stage
server.listen(4221, 'localhost', () => {
    console.log('Server is running on port 4221');
});

