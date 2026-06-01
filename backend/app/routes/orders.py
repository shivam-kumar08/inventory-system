from flask import Blueprint, request, jsonify
from app import db
from app.models import Order, OrderItem, Product, Customer

orders_bp = Blueprint("orders", __name__)


@orders_bp.route("/", methods=["GET"])
def get_orders():
    orders = Order.query.order_by(Order.created_at.desc()).all()
    return jsonify([o.to_dict() for o in orders])


@orders_bp.route("/<int:order_id>", methods=["GET"])
def get_order(order_id):
    order = Order.query.get_or_404(order_id)
    return jsonify(order.to_dict())


@orders_bp.route("/", methods=["POST"])
def create_order():
    data = request.get_json()

    if not data.get("customer_id"):
        return jsonify({"error": "'customer_id' is required"}), 400
    if not data.get("items") or not isinstance(data["items"], list) or len(data["items"]) == 0:
        return jsonify({"error": "'items' must be a non-empty list"}), 400

    customer = Customer.query.get(data["customer_id"])
    if not customer:
        return jsonify({"error": f"Customer {data['customer_id']} not found"}), 404

    # Validate all items and check stock before making any changes
    resolved = []
    for item in data["items"]:
        product_id = item.get("product_id")
        quantity = item.get("quantity")

        if not product_id or not quantity:
            return jsonify({"error": "Each item needs 'product_id' and 'quantity'"}), 400
        if int(quantity) <= 0:
            return jsonify({"error": "Quantity must be greater than 0"}), 400

        product = Product.query.get(product_id)
        if not product:
            return jsonify({"error": f"Product {product_id} not found"}), 404
        if product.stock < int(quantity):
            return jsonify({
                "error": f"Insufficient stock for '{product.name}'. "
                         f"Available: {product.stock}, requested: {quantity}"
            }), 422

        resolved.append((product, int(quantity)))

    # All validated — create order and deduct stock atomically
    total = sum(p.price * q for p, q in resolved)
    order = Order(
        customer_id=data["customer_id"],
        status=data.get("status", "pending"),
        total_amount=total,
    )
    db.session.add(order)
    db.session.flush()  # get order.id without committing

    for product, quantity in resolved:
        item = OrderItem(
            order_id=order.id,
            product_id=product.id,
            quantity=quantity,
            unit_price=product.price,
        )
        db.session.add(item)
        product.stock -= quantity  # auto stock deduction

    db.session.commit()
    return jsonify(order.to_dict()), 201


@orders_bp.route("/<int:order_id>", methods=["PUT"])
def update_order_status(order_id):
    order = Order.query.get_or_404(order_id)
    data = request.get_json()

    valid_statuses = ["pending", "confirmed", "shipped", "delivered", "cancelled"]
    if "status" in data:
        if data["status"] not in valid_statuses:
            return jsonify({"error": f"Invalid status. Must be one of: {valid_statuses}"}), 400
        order.status = data["status"]

    db.session.commit()
    return jsonify(order.to_dict())


@orders_bp.route("/<int:order_id>", methods=["DELETE"])
def delete_order(order_id):
    order = Order.query.get_or_404(order_id)
    db.session.delete(order)
    db.session.commit()
    return jsonify({"message": "Order deleted"}), 200
