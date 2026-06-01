from flask import Blueprint, request, jsonify
from app import db
from app.models import Product

products_bp = Blueprint("products", __name__)


@products_bp.route("/", methods=["GET"])
def get_products():
    products = Product.query.order_by(Product.created_at.desc()).all()
    return jsonify([p.to_dict() for p in products])


@products_bp.route("/<int:product_id>", methods=["GET"])
def get_product(product_id):
    product = Product.query.get_or_404(product_id)
    return jsonify(product.to_dict())


@products_bp.route("/", methods=["POST"])
def create_product():
    data = request.get_json()

    required = ["name", "sku", "price"]
    for field in required:
        if not data.get(field):
            return jsonify({"error": f"'{field}' is required"}), 400

    if Product.query.filter_by(sku=data["sku"]).first():
        return jsonify({"error": f"SKU '{data['sku']}' already exists"}), 409

    try:
        product = Product(
            name=data["name"],
            sku=data["sku"],
            description=data.get("description", ""),
            price=float(data["price"]),
            stock=int(data.get("stock", 0)),
        )
        db.session.add(product)
        db.session.commit()
        return jsonify(product.to_dict()), 201
    except ValueError as e:
        return jsonify({"error": str(e)}), 400


@products_bp.route("/<int:product_id>", methods=["PUT"])
def update_product(product_id):
    product = Product.query.get_or_404(product_id)
    data = request.get_json()

    if "sku" in data and data["sku"] != product.sku:
        if Product.query.filter_by(sku=data["sku"]).first():
            return jsonify({"error": f"SKU '{data['sku']}' already exists"}), 409
        product.sku = data["sku"]

    if "name" in data:
        product.name = data["name"]
    if "description" in data:
        product.description = data["description"]
    if "price" in data:
        product.price = float(data["price"])
    if "stock" in data:
        product.stock = int(data["stock"])

    db.session.commit()
    return jsonify(product.to_dict())


@products_bp.route("/<int:product_id>", methods=["DELETE"])
def delete_product(product_id):
    product = Product.query.get_or_404(product_id)
    db.session.delete(product)
    db.session.commit()
    return jsonify({"message": "Product deleted"}), 200
