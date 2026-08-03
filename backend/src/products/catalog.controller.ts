import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ProductsService } from './products.service';

// Endpoint público (sin JwtAuthGuard/RolesGuard a propósito): lo consumen las tiendas
// públicas (Tienda/Cotillón/FastCotillón) sin login, en vivo desde la DB.
@ApiTags('Catálogo público')
@Controller('catalog')
export class CatalogController {
  constructor(private readonly products: ProductsService) {}

  @Get() findAll() { return this.products.findPublicCatalog(); }
}
