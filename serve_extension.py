import http.server
import socketserver
import os
import mimetypes
import logging
import socket

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ExtensionHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        # Initialize mime types
        mimetypes.add_type('application/javascript', '.js')
        mimetypes.add_type('text/css', '.css')
        super().__init__(*args, **kwargs)

    def end_headers(self):
        # Add CORS headers for local testing
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET')
        self.send_header('Access-Control-Allow-Headers', '*')
        super().end_headers()

    def do_GET(self):
        try:
            # Remove leading slash and normalize path
            requested_path = self.path.lstrip('/')
            if not requested_path:
                requested_path = 'popup/popup.html'

            # Get the absolute path of the requested file
            file_path = os.path.abspath(os.path.join(os.getcwd(), requested_path))

            # Log the request
            logger.info(f"Requested path: {requested_path}")
            logger.info(f"Serving file: {file_path}")

            if os.path.exists(file_path) and os.path.isfile(file_path):
                # Serve the file
                with open(file_path, 'rb') as f:
                    self.send_response(200)
                    self.send_header('Content-Type', self.guess_type(file_path))
                    self.end_headers()
                    self.wfile.write(f.read())
            else:
                logger.error(f"File not found: {file_path}")
                self.send_error(404, f"File not found: {requested_path}")
        except Exception as e:
            logger.error(f"Error serving request: {str(e)}")
            self.send_error(500, f"Internal server error: {str(e)}")

    def guess_type(self, path):
        # Override mime type guessing to ensure proper content types
        if isinstance(path, str):
            if path.endswith('.js'):
                return 'application/javascript'
            if path.endswith('.css'):
                return 'text/css'
        return super().guess_type(path)

PORT = 8080

def is_port_in_use(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        try:
            s.bind(('0.0.0.0', port))
            return False
        except socket.error:
            return True

def run_server():
    if is_port_in_use(PORT):
        logger.error(f"Port {PORT} is already in use. Please free up the port and try again.")
        return

    try:
        with socketserver.TCPServer(("0.0.0.0", PORT), ExtensionHandler) as httpd:
            logger.info(f"Serving extension at http://0.0.0.0:{PORT}")
            httpd.serve_forever()
    except Exception as e:
        logger.error(f"Failed to start server: {str(e)}")
        raise

if __name__ == "__main__":
    run_server()