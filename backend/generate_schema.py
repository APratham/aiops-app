import models
import json
from pydantic import BaseModel
import inspect

def generate_schema():
    combined_schema = {"title": "All Models", "type": "object", "properties": {}}

    for name, obj in inspect.getmembers(models):
        if inspect.isclass(obj) and issubclass(obj, BaseModel) and obj is not BaseModel:
            combined_schema["properties"][name] = obj.schema()

    schema_filename = 'schema.json'

    with open(schema_filename, 'w') as file:
        json.dump(combined_schema, file, ensure_ascii=False, indent=2)

    print(f"Schema successfully written to {schema_filename}")

if __name__ == '__main__':
    generate_schema()
