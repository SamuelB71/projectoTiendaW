// Base de datos de productos - Ahora se carga desde Supabase
let products = [];
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let categories = [];

// Cargar productos desde Supabase
async function loadProductsFromSupabase() {
    console.log('🔄 Cargando productos desde Supabase...');
    
    try {
        const result = await productsDB.getProducts();
        
        if (result.success) {
            products = result.data;
            
            // Actualizar categorías
            categories = [...new Set(products.map(product => product.category))];
            
            console.log(`✅ ${products.length} productos cargados desde Supabase`);
            console.log('Categorías:', categories);
            
            // Disparar evento para notificar que los productos están listos
            window.dispatchEvent(new CustomEvent('productsLoaded'));
        } else {
            console.error('❌ Error cargando productos:', result.error);
            // Usar datos de respaldo si hay error
            loadFallbackProducts();
        }
    } catch (error) {
        console.error('❌ Error cargando productos:', error);
        loadFallbackProducts();
    }
}

// Datos de respaldo en caso de error
function loadFallbackProducts() {
    products = [
        {
            id: '1',
            name: "Nissin Cup Noodles",
            price: 2.99,
            category: "Copa",
            stock: 25,
            image_url: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1160&q=80",
            featured: true,
            description: "Fideos instantáneos en copa, sabor pollo",
            brand: "Nissin",
            active: true
        }
        // ... otros productos de respaldo
    ];
    categories = [...new Set(products.map(product => product.category))];
}

// Funciones de utilidad para la base de datos
function getProductById(id) {
    return products.find(product => product.id === id);
}

function updateProductStock(productId, quantity) {
    const product = getProductById(productId);
    if (product) {
        product.stock -= quantity;
        return true;
    }
    return false;
}

function getFeaturedProducts() {
    return products.filter(product => product.featured);
}

function getProductsByCategory(category) {
    if (category === 'all') return products;
    return products.filter(product => product.category === category);
}

function searchProducts(searchTerm) {
    const term = searchTerm.toLowerCase();
    return products.filter(product => 
        product.name.toLowerCase().includes(term) ||
        (product.brand && product.brand.toLowerCase().includes(term)) ||
        (product.description && product.description.toLowerCase().includes(term))
    );
}

// Cargar productos cuando se inicie la aplicación
document.addEventListener('DOMContentLoaded', function() {
    loadProductsFromSupabase();
});