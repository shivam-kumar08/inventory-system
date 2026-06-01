from flask import Blueprint, request, jsonify
from app import db
from app.models import Customer

customers_bp = Blueprint("customers", __name__)


@customers_bp.route("/", methods=["GET"])
def get_customers():
    customers = Customer.query.order_by(Customer.created_at.desc()).all()
    return jsonify([c.to_dict() for c in customers])


@customers_bp.route("/<int:customer_id>", methods=["GET"])
def get_customer(customer_id):
    customer = Customer.query.get_or_404(customer_id)
    return jsonify(customer.to_dict())


@customers_bp.route("/", methods=["POST"])
def create_customer():
    data = request.get_json()

    required = ["name", "email"]
    for field in required:
        if not data.get(field):
            return jsonify({"error": f"'{field}' is required"}), 400

    if Customer.query.filter_by(email=data["email"]).first():
        return jsonify({"error": f"Email '{data['email']}' already registered"}), 409

    customer = Customer(
        name=data["name"],
        email=data["email"],
        phone=data.get("phone", ""),
        address=data.get("address", ""),
    )
    db.session.add(customer)
    db.session.commit()
    return jsonify(customer.to_dict()), 201


@customers_bp.route("/<int:customer_id>", methods=["PUT"])
def update_customer(customer_id):
    customer = Customer.query.get_or_404(customer_id)
    data = request.get_json()

    if "email" in data and data["email"] != customer.email:
        if Customer.query.filter_by(email=data["email"]).first():
            return jsonify({"error": f"Email '{data['email']}' already registered"}), 409
        customer.email = data["email"]

    if "name" in data:
        customer.name = data["name"]
    if "phone" in data:
        customer.phone = data["phone"]
    if "address" in data:
        customer.address = data["address"]

    db.session.commit()
    return jsonify(customer.to_dict())


@customers_bp.route("/<int:customer_id>", methods=["DELETE"])
def delete_customer(customer_id):
    customer = Customer.query.get_or_404(customer_id)
    db.session.delete(customer)
    db.session.commit()
    return jsonify({"message": "Customer deleted"}), 200
