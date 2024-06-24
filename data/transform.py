class Transformer:
    def __init__(self):
        pass

    def transform(self, row, instructions):
        transformed_row = {}
        for key, value in row.items():
            transform_func_name = instructions.get('transform', {}).get(key)
            if transform_func_name:
                try:
                    transform_func = globals()[transform_func_name]
                    transformed_row[key] = transform_func(value)
                    print(f"Transformed {key}: {value} -> {transformed_row[key]}")
                except KeyError:
                    print(f"Warning: Transformation function '{transform_func_name}' for field '{key}' not found. Using original value.")
                    transformed_row[key] = value
            else:
                transformed_row[key] = value
        return transformed_row

def transform_name(value):
    transformed_value = value.title()
    print(f"Transforming name: {value} -> {transformed_value}")
    return transformed_value

def transform_age(value):
    transformed_value = value if value >= 0 else 0
    print(f"Transforming age: {value} -> {transformed_value}")
    return transformed_value

def transform_date(value):
    from datetime import datetime
    transformed_value = datetime.strptime(value, '%Y-%m-%d').date()
    print(f"Transforming date: {value} -> {transformed_value}")
    return transformed_value
