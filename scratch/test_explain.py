import urllib.request
import urllib.parse
import json

login_url = "http://localhost:8080/api/v1/auth/login"
explain_url = "http://localhost:8080/api/v1/vocab/explain/%E9%AA%AD"

# Login
login_data = json.dumps({
    "email": "admin@gmail.com",
    "password": "123456"
}).encode('utf-8')

req = urllib.request.Request(
    login_url,
    data=login_data,
    headers={'Content-Type': 'application/json'}
)

with urllib.request.urlopen(req) as response:
    res = json.loads(response.read().decode('utf-8'))
    token = res.get("result", {}).get("token")

print("Login successful. Token acquired.")

# Explain
req_explain = urllib.request.Request(
    explain_url,
    method='POST',
    headers={
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
)

with urllib.request.urlopen(req_explain) as response_explain:
    res_explain = json.loads(response_explain.read().decode('utf-8'))
    result_text = res_explain.get("result")
    print("Result type:", type(result_text))
    print("Result ends with 'undefined'?:", result_text.endswith("undefined") if result_text else False)
    print("Full result length:", len(result_text) if result_text else 0)
    print("Last 100 characters:")
    print(result_text[-100:] if result_text else None)
