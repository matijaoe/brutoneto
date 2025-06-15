# @brutoneto/api

REST API for Croatian salary calculations (bruto/neto conversions) built with [Nitro](https://nitro.unjs.io/).

## Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

## API Endpoints

### Salary Calculations

- **GET** `/api/neto/{gross}` - Convert gross salary to net
- **GET** `/api/bruto/{net}` - Convert net salary to gross

#### Query Parameters

- `place` - Croatian location (e.g., `zagreb`, `split`) or shortcut (`zg`, `svn`)
- `ltax` - Custom low tax rate (0-0.99)
- `htax` - Custom high tax rate (0-0.99) 
- `coeff` - Personal allowance coefficient (0.15-1.0)
- `third_pillar` - Third pillar pension contribution (0-750)
- `detailed` - Return detailed breakdown (`true`/`false`)
- `yearly` - Input is yearly amount (`true`/`false`)

#### Examples

```bash
# Basic conversion
curl "http://localhost:3000/api/neto/3000?place=zagreb"

# Detailed breakdown
curl "http://localhost:3000/api/neto/5000?place=zg&detailed=true"

# Custom tax rates
curl "http://localhost:3000/api/neto/4000?ltax=0.25&htax=0.35"

# Net to gross conversion
curl "http://localhost:3000/api/bruto/2500?place=split"
```

### Tax Information

- **GET** `/api/taxes/` - List all Croatian places
- **GET** `/api/taxes/default` - Get default tax rates
- **GET** `/api/taxes/{place}` - Get tax rates for specific place

#### Examples

```bash
# Get all places
curl "http://localhost:3000/api/taxes/"

# Get Zagreb tax rates
curl "http://localhost:3000/api/taxes/zagreb"

# Get default tax rates
curl "http://localhost:3000/api/taxes/default"
```

## Place Shortcuts

The API supports shortcuts for common Croatian locations:

- `zg` → `zagreb`
- `svn` → `sveta-nedelja-samobor`
- `smb` → `samobor`

## OpenAPI Documentation

The API includes OpenAPI specification and interactive documentation:

- **Scalar UI**: `/_scalar` - Modern API documentation interface
- **Swagger UI**: `/_swagger` - Classic Swagger documentation  
- **OpenAPI JSON**: `/_openapi.json` - Raw OpenAPI specification

Visit these endpoints when the server is running to explore the API interactively.

## Error Handling

The API returns structured error responses:

```json
{
  "statusCode": 400,
  "statusMessage": "Invalid gross amount",
  "message": "Field <gross>: Expected number, received string"
}
```

## Response Format

All salary calculation endpoints return results in EUR:

```json
{
  "gross": 3000,
  "net": 1986,
  "currency": "EUR"
}
```

Detailed responses include comprehensive breakdowns of taxes, contributions, and calculations.