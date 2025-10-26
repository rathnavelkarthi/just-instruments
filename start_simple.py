#!/usr/bin/env python3
"""
JUST INSTRUMENTS - Simple HTTP Server
This script starts a simple HTTP server to serve the calibration platform locally.
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
    """Custom HTTP request handler with proper MIME types and routing."""
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=os.getcwd(), **kwargs)
    
    def end_headers(self):
        # Add CORS headers for local development
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()
    
    def do_GET(self):
        # Route root to login page
        if self.path == '/':
            self.path = '/modern-login.html'
        # Route dashboard to dashboard page
        elif self.path == '/dashboard':
            self.path = '/modern-dashboard.html'
        # Route API calls to mock responses
        elif self.path.startswith('/api/'):
            self.send_api_response()
            return
        
        super().do_GET()
    
    def send_api_response(self):
        """Send mock API responses for local development."""
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        
        if self.path == '/api/health':
            response = '{"status": "OK", "timestamp": "2024-12-01T10:00:00Z", "version": "1.0.0"}'
        elif self.path == '/api/dashboard':
            response = '''{
                "stats": {
                    "totalCertificates": 1247,
                    "validCertificates": 1156,
                    "expiringCertificates": 23,
                    "expiredCertificates": 68,
                    "totalCustomers": 247,
                    "totalInstruments": 189,
                    "monthlyRevenue": 43630,
                    "growthRate": 15.2
                },
                "recentActivity": [
                    {"id": 1, "type": "certificate", "message": "Certificate JIC-20241201-001 created", "timestamp": "2024-12-01T10:30:00Z"},
                    {"id": 2, "type": "customer", "message": "New customer ABC Industries added", "timestamp": "2024-12-01T09:15:00Z"},
                    {"id": 3, "type": "instrument", "message": "Digital Multimeter calibrated", "timestamp": "2024-12-01T08:45:00Z"}
                ],
                "upcomingRenewals": [
                    {"id": 1, "certificate": "JIC-20241115-089", "customer": "XYZ Corp", "expiryDate": "2024-12-15"},
                    {"id": 2, "certificate": "JIC-20241120-134", "customer": "DEF Ltd", "expiryDate": "2024-12-20"}
                ]
            }'''
        else:
            response = '{"error": "Not found"}'
        
        self.wfile.write(response.encode())

def main():
    """Start the HTTP server and open browser."""
    print("🚀 JUST INSTRUMENTS - Calibration Platform")
    print("=" * 50)
    print(f"🌐 Starting server on http://{HOST}:{PORT}")
    print(f"📱 Login: http://{HOST}:{PORT}")
    print(f"📊 Dashboard: http://{HOST}:{PORT}/dashboard")
    print("=" * 50)
    print()
    print("🔐 Login Credentials:")
    print("Admin: admin@justinstruments.com / admin123")
    print("Staff: staff001 / staff123")
    print()
    print("Press Ctrl+C to stop the server")
    print("=" * 50)
    
    try:
        # Create server
        with socketserver.TCPServer((HOST, PORT), CustomHTTPRequestHandler) as httpd:
            # Open browser
            webbrowser.open(f'http://{HOST}:{PORT}')
            
            # Start serving
            httpd.serve_forever()
            
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
        sys.exit(0)
    except OSError as e:
        if e.errno == 10048:  # Port already in use
            print(f"❌ Port {PORT} is already in use. Trying port {PORT + 1}")
            try:
                with socketserver.TCPServer((HOST, PORT + 1), CustomHTTPRequestHandler) as httpd:
                    webbrowser.open(f'http://{HOST}:{PORT + 1}')
                    httpd.serve_forever()
            except OSError:
                print(f"❌ Could not start server. Please check if ports {PORT} and {PORT + 1} are available.")
                sys.exit(1)
        else:
            print(f"❌ Error starting server: {e}")
            sys.exit(1)

if __name__ == "__main__":
    main()
