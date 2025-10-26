#!/usr/bin/env python3
"""
Simple HTTP Server for Calibration Certificate Management Platform Demo
This will serve the demo.html file and show the platform running locally.
"""

import http.server
import socketserver
import webbrowser
import os
import sys
from pathlib import Path

# Configuration
PORT = 8000
HOST = 'localhost'

class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add CORS headers to allow cross-origin requests
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        super().end_headers()

    def do_GET(self):
        # If requesting root, serve demo.html
        if self.path == '/':
            self.path = '/demo.html'
        return super().do_GET()

def start_server():
    """Start the HTTP server and open browser"""
    try:
        # Change to the directory containing the files
        os.chdir(Path(__file__).parent)
        
        # Create server
        with socketserver.TCPServer((HOST, PORT), CustomHTTPRequestHandler) as httpd:
            print("=" * 60)
            print("🚀 CALIBRATION CERTIFICATE MANAGEMENT PLATFORM")
            print("=" * 60)
            print(f"📡 Server starting on http://{HOST}:{PORT}")
            print(f"🌐 Opening browser automatically...")
            print("=" * 60)
            print("📋 Features Available:")
            print("   ✅ Admin Dashboard Interface")
            print("   ✅ Customer Management")
            print("   ✅ Certificate Management")
            print("   ✅ Test Equipment Tracking")
            print("   ✅ Calibration Staff Management")
            print("   ✅ PDF Certificate Generation")
            print("   ✅ Notification System")
            print("   ✅ Reports & Analytics")
            print("=" * 60)
            print("💡 This is a demo interface showing the platform capabilities")
            print("🔧 For full functionality, install Node.js and run: npm install && npm start")
            print("=" * 60)
            print("Press Ctrl+C to stop the server")
            print("=" * 60)
            
            # Open browser
            webbrowser.open(f'http://{HOST}:{PORT}')
            
            # Start serving
            httpd.serve_forever()
            
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
        sys.exit(0)
    except OSError as e:
        if e.errno == 10048:  # Port already in use
            print(f"❌ Port {PORT} is already in use. Trying port {PORT + 1}...")
            global PORT
            PORT += 1
            start_server()
        else:
            print(f"❌ Error starting server: {e}")
            sys.exit(1)
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    start_server()
