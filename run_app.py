#!/usr/bin/env python3
import os
import signal
import subprocess
import sys
import time
import atexit
import threading
import re

# Project paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(BASE_DIR, "backend")
FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")

# Global process references
backend_process = None
frontend_process = None

# ANSI color codes
BLUE = "\033[94m"
GREEN = "\033[92m"
YELLOW = "\033[93m"
RED = "\033[91m"
RESET = "\033[0m"
BOLD = "\033[1m"

def kill_existing_processes():
    """Kill any existing uvicorn and npm processes"""
    print(f"{YELLOW}Terminating existing processes...{RESET}")
    subprocess.run("pkill -f uvicorn || true", shell=True)
    subprocess.run("pkill -f 'npm run dev' || true", shell=True)
    # Wait a moment to ensure ports are freed
    time.sleep(1)

def start_backend():
    """Start the backend server"""
    global backend_process
    print(f"\n{BLUE}➡️ Starting backend server on http://localhost:8001{RESET}")
    backend_cmd = f"cd {BACKEND_DIR} && source venv/bin/activate && uvicorn app:app --reload --port 8001"
    backend_process = subprocess.Popen(backend_cmd, shell=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, bufsize=1)
    return backend_process

def start_frontend():
    """Start the frontend server"""
    global frontend_process
    print(f"\n{GREEN}➡️ Starting frontend server on http://localhost:5173 (or 5174 if 5173 is in use){RESET}")
    frontend_cmd = f"cd {FRONTEND_DIR} && npm run dev"
    frontend_process = subprocess.Popen(frontend_cmd, shell=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, bufsize=1)
    return frontend_process

def cleanup():
    """Cleanup function to terminate all processes when script exits"""
    print(f"\n{RED}🛑 Shutting down servers...{RESET}")
    if backend_process:
        backend_process.terminate()
    if frontend_process:
        frontend_process.terminate()
    # Force kill any remaining processes
    subprocess.run("pkill -f uvicorn || true", shell=True)
    subprocess.run("pkill -f 'npm run dev' || true", shell=True)
    print(f"{GREEN}All servers shut down successfully{RESET}")

def monitor_output(process, prefix, color):
    """Monitor and print process output with colorized prefix"""
    for line in iter(process.stdout.readline, ''):
        if not line.strip():
            continue
            
        timestamp = time.strftime('%H:%M:%S')
        print(f"{color}[{timestamp}] {prefix}{RESET} | {line.strip()}")
        
        # Detect frontend URL
        if "Local:" in line and "http" in line:
            url_match = re.search(r'(http://localhost:\d+)', line)
            if url_match:
                frontend_url = url_match.group(1)
                print(f"\n{BOLD}{GREEN}✅ Frontend server running at {frontend_url}{RESET}\n")
                
        # Detect backend startup
        if "Application startup complete" in line:
            print(f"\n{BOLD}{BLUE}✅ Backend server running at http://localhost:8001{RESET}\n")

def signal_handler(sig, frame):
    """Handle Ctrl+C"""
    print(f"\n{RED}🛑 Received interrupt signal, shutting down...{RESET}")
    cleanup()
    sys.exit(0)

def main():
    # Register cleanup handlers
    atexit.register(cleanup)
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    # Kill any existing processes
    kill_existing_processes()
    
    # Start backend and frontend
    backend = start_backend()
    frontend = start_frontend()
    
    print(f"\n{BOLD}{GREEN}✅ AI Socratic Seminar is starting up!{RESET}")
    print(f"{YELLOW}   - Backend will be at: {BLUE}http://localhost:8001{RESET}")
    print(f"{YELLOW}   - Frontend will be at: {GREEN}http://localhost:5173 (or http://localhost:5174){RESET}")
    print(f"\n{YELLOW}📝 Press Ctrl+C to stop all servers{RESET}")
    
    # Start threads to monitor output
    backend_thread = threading.Thread(target=monitor_output, args=(backend, "BACKEND", BLUE), daemon=True)
    frontend_thread = threading.Thread(target=monitor_output, args=(frontend, "FRONTEND", GREEN), daemon=True)
    
    backend_thread.start()
    frontend_thread.start()
    
    # Monitor process status
    try:
        while True:
            # Check if processes are still running
            if backend.poll() is not None:
                print(f"{RED}⚠️ Backend process has stopped unexpectedly. Restarting...{RESET}")
                backend = start_backend()
                backend_thread = threading.Thread(target=monitor_output, args=(backend, "BACKEND", BLUE), daemon=True)
                backend_thread.start()
            
            if frontend.poll() is not None:
                print(f"{RED}⚠️ Frontend process has stopped unexpectedly. Restarting...{RESET}")
                frontend = start_frontend()
                frontend_thread = threading.Thread(target=monitor_output, args=(frontend, "FRONTEND", GREEN), daemon=True)
                frontend_thread.start()
                
            time.sleep(5)
    except KeyboardInterrupt:
        print(f"\n{RED}🛑 Received keyboard interrupt, shutting down...{RESET}")

if __name__ == "__main__":
    main() 