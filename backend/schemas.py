from pydantic import BaseModel, field_validator
from typing import Optional, List
from datetime import datetime
import re

# --- REVIEWS ---
class ReviewBase(BaseModel):
    user_name: str
    rating: int  # 1-5
    comment: str

class ReviewCreate(ReviewBase):
    product_id: int

class ReviewResponse(ReviewBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

# --- PRODUCTOS ---
class ProductBase(BaseModel):
    name: str
    price: float
    image: str
    category: str
    stock: int
    freeShipping: bool = False
    description: Optional[str] = None
    images: Optional[str] = None  # JSON-encoded list of URLs

class ProductCreate(ProductBase):
    pass

class ProductResponse(ProductBase):
    id: int
    reviews: List[ReviewResponse] = []
    class Config:
        from_attributes = True

# --- USUARIOS & AUTH ---
class Token(BaseModel):
    access_token: str
    token_type: str
    is_admin: bool = False

class UserResponse(BaseModel):
    id: int
    username: str
    email: Optional[str] = None
    is_admin: bool
    class Config:
        from_attributes = True

class UserCreate(BaseModel):
    username: str
    email: str
    password: str

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        pattern = r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"
        if not re.match(pattern, v):
            raise ValueError("Formato de email inválido")
        return v.lower()

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("La contraseña debe tener al menos 8 caracteres")
        return v

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

# --- ORDENES & PAGOS ---
class OrderCreate(BaseModel):
    id: str
    customer: str
    document: str
    email: str
    phone: str
    amount: float
    items: List[dict] = []

class OrderResponse(OrderCreate):
    date: str
    status: str
    preference_id: Optional[str] = None
    payment_id: Optional[str] = None
    courier: Optional[str] = None
    tracking_number: Optional[str] = None
    class Config:
        from_attributes = True

class ShipOrder(BaseModel):
    courier: str
    tracking_number: str

class MPPreference(BaseModel):
    init_point: str

# --- WISHLIST ---
class WishlistItemResponse(BaseModel):
    id: int
    product_id: int
    product: ProductResponse
    created_at: datetime
    class Config:
        from_attributes = True

# --- SAAS CONFIG ---
class SaasConfigBase(BaseModel):
    hero_title: str
    hero_subtitle: str
    feature_1_title: str
    feature_1_desc: str
    feature_2_title: str
    feature_2_desc: str
    feature_3_title: str
    feature_3_desc: str
    price_starter: float
    price_pro: float
    cta_text: str
    store_name: str
    store_logo: str
    active_theme: int
    whatsapp_number: str = "56912345678"
    instagram_url: str = ""
    facebook_url: str = ""
    tiktok_url: str = ""
    accent_color: str = "#f7c948"

class SaasConfigResponse(SaasConfigBase):
    id: int
    class Config:
        from_attributes = True


# --- PAGOS CONFIG ---
class PaymentConfigUpdate(BaseModel):
    mp_access_token: Optional[str] = None
    transfer_enabled: bool = False
    bank_name: Optional[str] = None
    bank_account_type: Optional[str] = None
    bank_account_number: Optional[str] = None
    bank_holder_name: Optional[str] = None
    bank_holder_rut: Optional[str] = None
    bank_email: Optional[str] = None
    transfer_instructions: Optional[str] = None

class PaymentConfigPublic(BaseModel):
    transfer_enabled: bool = False
    bank_name: Optional[str] = None
    bank_account_type: Optional[str] = None
    bank_account_number: Optional[str] = None
    bank_holder_name: Optional[str] = None
    bank_holder_rut: Optional[str] = None
    bank_email: Optional[str] = None
    transfer_instructions: Optional[str] = None
    mp_enabled: bool = False
    class Config:
        from_attributes = True

class TransferOrderCreate(BaseModel):
    id: str
    customer: str
    document: str
    email: str
    phone: str
    amount: float
    items: List[dict] = []
