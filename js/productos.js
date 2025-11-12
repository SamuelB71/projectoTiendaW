// Funcionalidad específica para la página de productos

// Cargar productos destacados (para index.html)
async function loadFeaturedProducts() {
    const container = document.getElementById('featured-products');
    if (!container) {
        console.log('Contenedor de productos destacados no encontrado');
        return;
    }
    
    console.log('🔄 Cargando productos destacados...');
    container.innerHTML = '<div class="col-12 text-center"><div class="spinner-border text-primary" role="status"></div><p class="mt-2">Cargando productos...</p></div>';
    
    try {
        // Esperar a que los productos se carguen
        if (products.length === 0) {
            await loadProductsFromSupabase();
        }
        
        const featuredProducts = getFeaturedProducts();
        console.log(`✅ ${featuredProducts.length} productos destacados cargados`);
        
        if (featuredProducts.length === 0) {
            container.innerHTML = `
                <div class="col-12 text-center">
                    <div class="empty-cart-message">
                        <i class="bi bi-star"></i>
                        <h4>No hay productos destacados</h4>
                        <p>Próximamente agregaremos más productos</p>
                    </div>
                </div>
            `;
            return;
        }
        
        container.innerHTML = '';
        featuredProducts.forEach(product => {
            const productCard = createProductCard(product);
            container.innerHTML += productCard;
        });
        
    } catch (error) {
        console.error('❌ Error cargando productos destacados:', error);
        container.innerHTML = `
            <div class="col-12 text-center">
                <div class="alert alert-warning">
                    <i class="bi bi-exclamation-triangle"></i>
                    <h4>Error cargando productos</h4>
                    <p>Intenta recargar la página</p>
                </div>
            </div>
        `;
    }
}

// Cargar todos los productos (para productos.html)
async function loadAllProducts() {
    const container = document.getElementById('products-container');
    if (!container) return;
    
    console.log('🔄 Cargando todos los productos...');
    container.innerHTML = '<div class="col-12 text-center"><div class="spinner-border text-primary" role="status"></div><p class="mt-2">Cargando productos...</p></div>';
    
    try {
        // Esperar a que los productos se carguen
        if (products.length === 0) {
            await loadProductsFromSupabase();
        }
        
        // Cargar categorías en el filtro
        const categoryFilter = document.getElementById('category-filter');
        if (categoryFilter) {
            categoryFilter.innerHTML = '<option value="all">Todas las categorías</option>';
            categories.forEach(category => {
                categoryFilter.innerHTML += `<option value="${category}">${category}</option>`;
            });
        }
        
        console.log(`✅ ${products.length} productos cargados`);
        container.innerHTML = '';
        products.forEach(product => {
            const productCard = createProductCard(product);
            container.innerHTML += productCard;
        });
        
    } catch (error) {
        console.error('❌ Error cargando productos:', error);
        container.innerHTML = `
            <div class="col-12 text-center">
                <div class="alert alert-danger">
                    <i class="bi bi-exclamation-triangle"></i>
                    <h4>Error cargando productos</h4>
                    <p>Intenta recargar la página</p>
                </div>
            </div>
        `;
    }
}