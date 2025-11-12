// Gestión del panel de administración
class AdminManager {
    constructor() {
        this.isAdmin = false;
        this.currentSection = 'dashboard';
        this.products = [];
        this.orders = [];
        this.init();
    }

    async init() {
        await this.checkAdminAccess();
        this.setupEventListeners();
        await this.loadDashboardData();
    }

    async checkAdminAccess() {
        const result = await adminDB.isAdmin();
        
        if (result.success && result.isAdmin) {
            this.isAdmin = true;
            this.updateAdminUI(result.adminData);
        } else {
            // Redirigir si no es administrador
            window.location.href = '../index.html';
            return;
        }
    }

    updateAdminUI(adminData) {
        const welcomeElement = document.getElementById('admin-welcome');
        if (welcomeElement) {
            welcomeElement.textContent = `Hola, ${adminData.email}`;
        }
    }

    setupEventListeners() {
        // Botón de logout
        const logoutBtn = document.getElementById('admin-logout');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }

        // Botón de guardar producto
        const saveProductBtn = document.getElementById('save-product-btn');
        if (saveProductBtn) {
            saveProductBtn.addEventListener('click', () => this.handleSaveProduct());
        }

        // Modal events
        const productModal = document.getElementById('productModal');
        if (productModal) {
            productModal.addEventListener('hidden.bs.modal', () => {
                this.resetProductForm();
            });
        }
    }

    async handleLogout() {
        try {
            await supabaseAuth.signOut();
            window.location.href = '../index.html';
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
        }
    }

    async loadDashboardData() {
        await this.loadProducts();
        await this.loadOrders();
        this.updateDashboardStats();
    }

    async loadProducts() {
        try {
            const result = await adminDB.getAllProducts();
            if (result.success) {
                this.products = result.data;
            } else {
                console.error('Error cargando productos:', result.error);
            }
        } catch (error) {
            console.error('Error cargando productos:', error);
        }
    }

    async loadOrders() {
        try {
            const result = await adminDB.getAllOrders();
            if (result.success) {
                this.orders = result.data;
            } else {
                console.error('Error cargando órdenes:', result.error);
            }
        } catch (error) {
            console.error('Error cargando órdenes:', error);
        }
    }

    updateDashboardStats() {
        // Productos totales
        document.getElementById('total-products').textContent = this.products.length;
        
        // Pedidos totales
        document.getElementById('total-orders').textContent = this.orders.length;
        
        // Productos con stock bajo (< 10)
        const lowStock = this.products.filter(p => p.stock < 10).length;
        document.getElementById('low-stock').textContent = lowStock;
        
        // Productos destacados
        const featured = this.products.filter(p => p.featured).length;
        document.getElementById('featured-products').textContent = featured;
    }

    showSection(sectionName) {
        // Ocultar todas las secciones
        document.querySelectorAll('.admin-section').forEach(section => {
            section.classList.add('d-none');
        });

        // Mostrar sección seleccionada
        const targetSection = document.getElementById(`${sectionName}-section`);
        if (targetSection) {
            targetSection.classList.remove('d-none');
            this.currentSection = sectionName;
            
            // Cargar contenido específico de la sección
            this.loadSectionContent(sectionName);
        }
    }

    async loadSectionContent(sectionName) {
        switch (sectionName) {
            case 'products':
                await this.loadProductsSection();
                break;
            case 'orders':
                await this.loadOrdersSection();
                break;
        }
    }

    async loadProductsSection() {
        await this.loadProducts();
        this.renderProductsTable();
    }

    renderProductsTable() {
        const section = document.getElementById('products-section');
        if (!section) return;

        section.innerHTML = `
            <div class="row">
                <div class="col-12">
                    <div class="d-flex justify-content-between align-items-center mb-4">
                        <h2><i class="bi bi-box-seam me-2"></i>Gestión de Productos</h2>
                        <button class="btn btn-primary" onclick="adminManager.showAddProductForm()">
                            <i class="bi bi-plus-circle me-2"></i>Agregar Producto
                        </button>
                    </div>
                </div>
            </div>

            <div class="admin-filters">
                <div class="row">
                    <div class="col-md-4">
                        <input type="text" class="form-control" id="product-search" placeholder="Buscar productos...">
                    </div>
                    <div class="col-md-3">
                        <select class="form-select" id="category-filter">
                            <option value="">Todas las categorías</option>
                            <option value="Copa">Copa</option>
                            <option value="Sobre">Sobre</option>
                            <option value="Picante">Picante</option>
                            <option value="Fritos">Fritos</option>
                        </select>
                    </div>
                    <div class="col-md-3">
                        <select class="form-select" id="status-filter">
                            <option value="">Todos los estados</option>
                            <option value="active">Activos</option>
                            <option value="inactive">Inactivos</option>
                        </select>
                    </div>
                    <div class="col-md-2">
                        <button class="btn btn-outline-secondary w-100" onclick="adminManager.applyFilters()">
                            <i class="bi bi-funnel"></i> Filtrar
                        </button>
                    </div>
                </div>
            </div>

            <div class="admin-table">
                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th>Producto</th>
                                <th>Categoría</th>
                                <th>Precio</th>
                                <th>Stock</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody id="products-table-body">
                            ${this.generateProductsTableRows()}
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="row mt-3">
                <div class="col-12">
                    <div class="d-flex justify-content-between align-items-center">
                        <span class="text-muted">
                            Mostrando ${this.products.length} productos
                        </span>
                        <button class="btn btn-outline-primary" onclick="adminManager.exportProducts()">
                            <i class="bi bi-download me-2"></i>Exportar
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Configurar event listeners para los filtros
        this.setupProductsFilters();
    }

    generateProductsTableRows() {
        if (this.products.length === 0) {
            return `
                <tr>
                    <td colspan="6" class="text-center py-4">
                        <i class="bi bi-inbox display-1 text-muted"></i>
                        <p class="mt-3">No hay productos registrados</p>
                        <button class="btn btn-primary" onclick="adminManager.showAddProductForm()">
                            Agregar Primer Producto
                        </button>
                    </td>
                </tr>
            `;
        }

        return this.products.map(product => `
            <tr>
                <td>
                    <div class="d-flex align-items-center">
                        <img src="${product.image_url || 'https://via.placeholder.com/50x50?text=Imagen'}" 
                             alt="${product.name}" 
                             class="rounded me-3" 
                             style="width: 50px; height: 50px; object-fit: cover;">
                        <div>
                            <strong>${product.name}</strong>
                            ${product.brand ? `<br><small class="text-muted">${product.brand}</small>` : ''}
                        </div>
                    </div>
                </td>
                <td>${product.category}</td>
                <td>$${parseFloat(product.price).toFixed(2)}</td>
                <td>
                    <div class="d-flex align-items-center">
                        <span class="me-2">${product.stock}</span>
                        <div class="stock-bar" style="width: 60px;">
                            <div class="stock-fill ${this.getStockClass(product.stock)}" 
                                 style="width: ${Math.min((product.stock / 50) * 100, 100)}%"></div>
                        </div>
                    </div>
                </td>
                <td>
                    ${product.active ? 
                        '<span class="status-badge status-active">Activo</span>' : 
                        '<span class="status-badge status-inactive">Inactivo</span>'
                    }
                    ${product.featured ? '<span class="status-badge status-featured ms-1">Destacado</span>' : ''}
                </td>
                <td>
                    <button class="btn btn-outline-primary btn-action" 
                            onclick="adminManager.editProduct('${product.id}')"
                            title="Editar">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-outline-${product.active ? 'warning' : 'success'} btn-action" 
                            onclick="adminManager.toggleProductStatus('${product.id}', ${!product.active})"
                            title="${product.active ? 'Desactivar' : 'Activar'}">
                        <i class="bi bi-${product.active ? 'eye-slash' : 'eye'}"></i>
                    </button>
                    <button class="btn btn-outline-danger btn-action" 
                            onclick="adminManager.deleteProduct('${product.id}')"
                            title="Eliminar">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    getStockClass(stock) {
        if (stock > 20) return 'stock-high';
        if (stock > 5) return 'stock-medium';
        return 'stock-low';
    }

    showAddProductForm() {
        document.getElementById('productModalTitle').textContent = 'Agregar Producto';
        document.getElementById('product-id').value = '';
        document.getElementById('product-form').reset();
        
        const modal = new bootstrap.Modal(document.getElementById('productModal'));
        modal.show();
    }

    async editProduct(productId) {
        try {
            const result = await productsDB.getProductById(productId);
            if (result.success) {
                const product = result.data;
                
                document.getElementById('productModalTitle').textContent = 'Editar Producto';
                document.getElementById('product-id').value = product.id;
                document.getElementById('product-name').value = product.name;
                document.getElementById('product-brand').value = product.brand || '';
                document.getElementById('product-price').value = product.price;
                document.getElementById('product-stock').value = product.stock;
                document.getElementById('product-category').value = product.category;
                document.getElementById('product-image').value = product.image_url || '';
                document.getElementById('product-description').value = product.description || '';
                document.getElementById('product-featured').checked = product.featured;
                document.getElementById('product-active').checked = product.active;
                
                const modal = new bootstrap.Modal(document.getElementById('productModal'));
                modal.show();
            }
        } catch (error) {
            console.error('Error cargando producto:', error);
            this.showAlert('Error al cargar el producto', 'danger');
        }
    }

    async handleSaveProduct() {
        const productId = document.getElementById('product-id').value;
        const productData = {
            name: document.getElementById('product-name').value,
            brand: document.getElementById('product-brand').value,
            price: parseFloat(document.getElementById('product-price').value),
            stock: parseInt(document.getElementById('product-stock').value),
            category: document.getElementById('product-category').value,
            image_url: document.getElementById('product-image').value,
            description: document.getElementById('product-description').value,
            featured: document.getElementById('product-featured').checked,
            active: document.getElementById('product-active').checked
        };

        try {
            let result;
            if (productId) {
                // Actualizar producto existente
                result = await adminDB.updateProduct(productId, productData);
            } else {
                // Crear nuevo producto
                result = await adminDB.createProduct(productData);
            }

            if (result.success) {
                const modal = bootstrap.Modal.getInstance(document.getElementById('productModal'));
                modal.hide();
                
                this.showAlert(
                    productId ? 'Producto actualizado correctamente' : 'Producto creado correctamente', 
                    'success'
                );
                
                // Recargar la sección de productos
                await this.loadProductsSection();
            } else {
                this.showAlert('Error al guardar el producto: ' + result.error, 'danger');
            }
        } catch (error) {
            console.error('Error guardando producto:', error);
            this.showAlert('Error al guardar el producto', 'danger');
        }
    }

    async toggleProductStatus(productId, newStatus) {
        try {
            const result = await adminDB.updateProduct(productId, { active: newStatus });
            if (result.success) {
                this.showAlert(
                    `Producto ${newStatus ? 'activado' : 'desactivado'} correctamente`, 
                    'success'
                );
                await this.loadProductsSection();
            }
        } catch (error) {
            console.error('Error cambiando estado:', error);
            this.showAlert('Error al cambiar el estado del producto', 'danger');
        }
    }

    async deleteProduct(productId) {
        if (confirm('¿Estás seguro de que quieres eliminar este producto? Esta acción no se puede deshacer.')) {
            try {
                const result = await adminDB.deleteProduct(productId);
                if (result.success) {
                    this.showAlert('Producto eliminado correctamente', 'success');
                    await this.loadProductsSection();
                }
            } catch (error) {
                console.error('Error eliminando producto:', error);
                this.showAlert('Error al eliminar el producto', 'danger');
            }
        }
    }

    resetProductForm() {
        document.getElementById('product-form').reset();
        document.getElementById('product-id').value = '';
    }

    showAlert(message, type) {
        // Crear alerta temporal
        const alert = document.createElement('div');
        alert.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        alert.style.top = '20px';
        alert.style.right = '20px';
        alert.style.zIndex = '1060';
        alert.style.minWidth = '300px';
        alert.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(alert);
        
        // Auto-eliminar después de 5 segundos
        setTimeout(() => {
            if (alert.parentNode) {
                alert.parentNode.removeChild(alert);
            }
        }, 5000);
    }

    // Métodos para la sección de órdenes (simplificado)
    async loadOrdersSection() {
        await this.loadOrders();
        
        const section = document.getElementById('orders-section');
        if (!section) return;

        section.innerHTML = `
            <div class="row">
                <div class="col-12">
                    <h2><i class="bi bi-receipt me-2"></i>Gestión de Pedidos</h2>
                    <p class="text-muted">${this.orders.length} pedidos encontrados</p>
                </div>
            </div>

            <div class="admin-table">
                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th>ID Pedido</th>
                                <th>Cliente</th>
                                <th>Total</th>
                                <th>Estado</th>
                                <th>Fecha</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.orders.map(order => `
                                <tr>
                                    <td><strong>#${order.id.slice(-8)}</strong></td>
                                    <td>
                                        <div>${order.customer_name}</div>
                                        <small class="text-muted">${order.customer_email}</small>
                                    </td>
                                    <td>$${parseFloat(order.order_total).toFixed(2)}</td>
                                    <td>
                                        <span class="status-badge status-${order.order_status}">
                                            ${this.getOrderStatusText(order.order_status)}
                                        </span>
                                    </td>
                                    <td>${new Date(order.created_at).toLocaleDateString('es-ES')}</td>
                                    <td>
                                        <button class="btn btn-outline-primary btn-action" 
                                                onclick="adminManager.viewOrderDetails('${order.id}')">
                                            <i class="bi bi-eye"></i>
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    getOrderStatusText(status) {
        const statusMap = {
            'pending': 'Pendiente',
            'processing': 'Procesando',
            'shipped': 'Enviado',
            'delivered': 'Entregado',
            'cancelled': 'Cancelado'
        };
        return statusMap[status] || status;
    }

    viewOrderDetails(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (order) {
            alert(`Detalles del pedido ${orderId}\n\nCliente: ${order.customer_name}\nTotal: $${order.order_total}\nEstado: ${this.getOrderStatusText(order.order_status)}`);
        }
    }

    // Métodos de utilidad
    setupProductsFilters() {
        // Implementar lógica de filtros aquí
    }

    applyFilters() {
        // Implementar aplicación de filtros aquí
    }

    exportProducts() {
        // Implementar exportación de productos aquí
        alert('Funcionalidad de exportación en desarrollo');
    }

    manageStock() {
        this.showSection('products');
    }

    exportData() {
        alert('Funcionalidad de exportación en desarrollo');
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.adminManager = new AdminManager();
});