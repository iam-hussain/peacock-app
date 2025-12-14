# Peacock Club - Financial Management System

A comprehensive financial club management system built with Next.js 14, TypeScript, Prisma, and MongoDB. This application enables transparent tracking and management of member deposits, loans, interest calculations, and vendor investments for financial clubs.

## Features

### Core Functionality

- **Member Management**: Complete member lifecycle management with access control
- **Transaction Processing**: Handle deposits, withdrawals, loans, and vendor transactions
- **Loan Management**: Track loan history, calculate interest, and manage repayments
- **Passbook System**: Real-time passbook updates for members, vendors, and club
- **Financial Analytics**: Dashboard with statistics, charts, and financial insights
- **Vendor Management**: Track vendor investments, returns, and profits
- **Access Control**: Role-based access (Super Admin, Admin, Member) with read/write permissions

### Key Capabilities

- **Automated Calculations**: Smart algorithms handle interest, returns, and balances
- **Transaction History**: Complete audit trail of all financial transactions
- **Real-time Updates**: Passbooks update automatically when transactions are processed
- **Loan Interest Calculation**: Monthly and daily interest calculations based on loan periods
- **Member Statements**: Detailed financial statements for each member
- **Club Statistics**: Comprehensive club-wide financial statistics and analytics

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: MongoDB with Prisma ORM
- **UI Components**: shadcn/ui (Radix UI + Tailwind CSS)
- **State Management**: TanStack Query (React Query)
- **Authentication**: JWT with HTTP-only cookies
- **Charts**: Chart.js with react-chartjs-2
- **Form Handling**: React Hook Form + Zod validation
- **Styling**: Tailwind CSS with custom theme system

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- MongoDB database (local or cloud)
- Environment variables configured

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd peacock-app
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Configure the following in `.env`:
```env
# Database
DATABASE_URL="mongodb://localhost:27017/peacock-club"

# JWT Secret (use a strong random string)
JWT_SECRET="your-secret-key-here"

# Super Admin Credentials
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="your-admin-password"

# Next.js
NODE_ENV="development"
```

4. Generate Prisma Client:
```bash
npm run generate
# or
npx prisma generate
```

5. Push database schema (for development):
```bash
npm run push
# or
npx prisma db push
```

6. Seed database (optional):
```bash
npm run seed
```

7. Run the development server:
```bash
npm run dev
```

The application will be available at [http://localhost:3001](http://localhost:3001)

## Project Structure

```
peacock-app/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/                # API routes
│   │   │   ├── account/        # Account management endpoints
│   │   │   ├── action/         # System actions (recalculate, backup)
│   │   │   ├── auth/           # Authentication endpoints
│   │   │   ├── statistics/     # Statistics and analytics
│   │   │   └── transaction/    # Transaction management
│   │   ├── dashboard/          # Dashboard pages
│   │   │   ├── member/         # Member pages
│   │   │   ├── settings/       # Settings page
│   │   │   └── transaction/    # Transaction pages
│   │   └── page.tsx            # Landing page
│   ├── components/             # React components
│   │   ├── atoms/              # Basic UI components
│   │   ├── molecules/          # Composite components
│   │   ├── organisms/          # Complex components
│   │   └── ui/                 # shadcn/ui components
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # Utility functions and helpers
│   │   ├── auth.ts             # Authentication utilities
│   │   ├── cache.ts            # Caching system
│   │   ├── club.ts             # Club calculation functions
│   │   ├── date.ts             # Date utilities
│   │   ├── helper.ts           # General helpers
│   │   └── type.ts             # TypeScript types
│   ├── logic/                  # Business logic
│   │   ├── loan-handler.ts     # Loan calculation logic
│   │   ├── reset-handler.ts    # Reset/recalculate logic
│   │   ├── settings.ts         # Transaction settings
│   │   ├── transaction-handler.ts  # Transaction processing
│   │   └── vendor-middleware.ts    # Vendor calculations
│   ├── transformers/           # Data transformers
│   └── middleware.ts           # Next.js middleware
├── prisma/
│   ├── schema.prisma           # Database schema
│   └── seed.ts                 # Database seed script
└── public/                      # Static assets
```

## Key Concepts

### Passbook System

The passbook system tracks financial data for three entity types:
- **Member Passbook**: Tracks deposits, withdrawals, loans, and balances
- **Vendor Passbook**: Tracks investments, returns, and profits
- **Club Passbook**: Aggregates all club-wide financial data

### Transaction Types

- `PERIODIC_DEPOSIT`: Regular monthly member deposits
- `OFFSET_DEPOSIT`: Offset/adjustment deposits
- `WITHDRAW`: Member withdrawals
- `REJOIN`: Member rejoining after withdrawal
- `FUNDS_TRANSFER`: Transfer between accounts
- `VENDOR_INVEST`: Vendor investment
- `VENDOR_RETURNS`: Vendor returns
- `LOAN_TAKEN`: Member taking a loan
- `LOAN_REPAY`: Loan repayment
- `LOAN_INTEREST`: Loan interest payment

### Loan History

Loan history is stored in the passbook's `loanHistory` field and includes:
- Active/inactive status
- Loan amount
- Start and end dates
- Interest calculations
- Monthly and daily interest breakdown

## Development

### Available Scripts

```bash
# Development
npm run dev              # Start development server (port 3001)

# Building
npm run build            # Build for production
npm run start            # Start production server

# Database
npm run generate         # Generate Prisma Client
npm run push             # Push schema to database
npm run migrate          # Run migrations
npm run seed             # Seed database
npm run truncate         # Clear database
npm run reset            # Truncate and seed

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint errors
npm run format           # Format code with Prettier
```

### Code Style

- **TypeScript**: Strict mode enabled
- **Formatting**: Prettier with 2-space indent, double quotes, semicolons
- **Linting**: ESLint with Next.js, TypeScript, and import sorting rules
- **Naming**: camelCase for variables/functions, PascalCase for components/types

See `.cursor/rules` for detailed coding standards.

## Database Schema

### Main Models

- **Account**: User accounts (members, vendors, admins)
- **Transaction**: All financial transactions
- **Passbook**: Financial records for accounts and club

### Key Relationships

- Account → Passbook (1:1)
- Account → Transactions (1:many, as from/to)
- Passbook stores JSON payload with financial data
- Passbook stores loanHistory as JSON array

## Authentication & Authorization

### Roles

- **SUPER_ADMIN**: Virtual user from environment variables
- **ADMIN**: Database user with admin role
- **MEMBER**: Regular member with read/write access flags

### Access Control

- `readAccess`: Can view data
- `writeAccess`: Can create/modify transactions
- `canLogin`: Can access the dashboard

See `AUTH_IMPLEMENTATION.md` for detailed authentication documentation.

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `GET /api/auth/status` - Check auth status

### Accounts
- `POST /api/account` - Get all accounts
- `POST /api/account/loan` - Get loan accounts
- `POST /api/account/member/[username]` - Get member by username
- `POST /api/account/vendor` - Get vendor accounts

### Transactions
- `GET /api/transaction` - List transactions
- `POST /api/transaction/add` - Create transaction
- `PATCH /api/transaction/[id]` - Update transaction
- `DELETE /api/transaction/[id]` - Delete transaction

### Statistics
- `POST /api/statistics` - Get club statistics

### Actions
- `POST /api/action/recalculate` - Recalculate all passbooks
- `POST /api/action/backup` - Create database backup

## Environment Variables

Required environment variables:

```env
# Database
DATABASE_URL="mongodb://..."

# Authentication
JWT_SECRET="your-secret-key"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="admin-password"

# Application
NODE_ENV="development"
```

## Deployment

### Build for Production

```bash
npm run build
npm run start
```

### Vercel Deployment

The easiest way to deploy is using [Vercel](https://vercel.com):

1. Push your code to GitHub
2. Import project in Vercel
3. Configure environment variables
4. Deploy

See [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

## Contributing

1. Follow the coding standards in `.cursor/rules`
2. Ensure all linting and type checks pass
3. Write clear commit messages
4. Test thoroughly before submitting

## License

[Add your license here]

## Support

For issues and questions, please open an issue in the repository.
