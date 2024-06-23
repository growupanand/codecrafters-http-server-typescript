import * as net from 'net';

const server = net.createServer((socket) => {
    
    // socket.write(Buffer.from('HTTP/1.1 200 OK\r\n\r\n'));
    // socket.end();
    socket.on('data', (data)=>{
        const request = data.toString();
        const path = request.split(' ')[1];

        let response;

        switch (path) {
            case "/":
                response = 'HTTP/1.1 200 OK\r\n\r\n';
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
