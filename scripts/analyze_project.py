import os
import json

BACKEND_PATH = "/Users/hazarekiz/sunucu_yonetimi/affex_ai_servers/AffeXAI-main/apps/backend/src/modules"
FRONTEND_PATH = "/Users/hazarekiz/sunucu_yonetimi/affex_ai_servers/AffeXAI-main/apps/frontend/src/app"

def count_files(path, extension=".ts"):
    count = 0
    files_list = []
    if not os.path.exists(path):
        return 0, []
    for root, dirs, files in os.walk(path):
        for file in files:
            if file.endswith(extension) and not file.endswith(".spec.ts"):
                count += 1
                files_list.append(file)
    return count, files_list

def analyze_backend():
    modules = {}
    if not os.path.exists(BACKEND_PATH):
        return modules
    
    for module_name in os.listdir(BACKEND_PATH):
        module_path = os.path.join(BACKEND_PATH, module_name)
        if os.path.isdir(module_path):
            services_count, services = count_files(os.path.join(module_path), ".service.ts")
            controllers_count, controllers = count_files(os.path.join(module_path), ".controller.ts")
            entities_count, entities = count_files(os.path.join(module_path), ".entity.ts")
            
            # Simple heuristic for implementation depth
            status = "Empty"
            if services_count > 0: status = "Implemented"
            if services_count > 5: status = "Robust"
            
            modules[module_name] = {
                "status": status,
                "services": services_count,
                "controllers": controllers_count,
                "entities": entities_count,
                "details": {
                    "service_names": services,
                    "entity_names": entities
                }
            }
    return modules

def analyze_frontend():
    routes = []
    if not os.path.exists(FRONTEND_PATH):
        return routes
        
    for root, dirs, files in os.walk(FRONTEND_PATH):
        if "page.tsx" in files:
            route = root.replace(FRONTEND_PATH, "")
            if route == "": route = "/"
            routes.append(route)
    return routes

report = {
    "backend_modules": analyze_backend(),
    "frontend_routes": analyze_frontend()
}

print(json.dumps(report, indent=2))
