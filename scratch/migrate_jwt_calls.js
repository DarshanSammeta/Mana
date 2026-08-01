const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  'server.ts',
  'src/middleware.ts',
  'src/lib/auth.ts',
  'src/app/api/admin/audit-logs/route.ts',
  'src/app/api/admin/dashboard/heatmaps/route.ts',
  'src/app/api/admin/dashboard/live-stats/route.ts',
  'src/app/api/admin/dashboard/queue-stats/route.ts',
  'src/app/api/admin/dashboard/revenue/route.ts',
  'src/app/api/admin/disputes/[id]/resolve/route.ts',
  'src/app/api/admin/documents/[id]/route.ts',
  'src/app/api/admin/documents/route.ts',
  'src/app/api/admin/live-tracking/route.ts',
  'src/app/api/admin/payments/route.ts',
  'src/app/api/admin/payouts/route.ts',
  'src/app/api/admin/security-stats/route.ts',
  'src/app/api/admin/settings/commission/route.ts',
  'src/app/api/admin/users/route.ts',
  'src/app/api/admin/vendors/[id]/approve/route.ts',
  'src/app/api/admin/vendors/[id]/reactivate/route.ts',
  'src/app/api/admin/vendors/[id]/reject/route.ts',
  'src/app/api/admin/vendors/[id]/route.ts',
  'src/app/api/admin/vendors/[id]/suspend/route.ts',
  'src/app/api/admin/vendors/bulk-action/route.ts',
  'src/app/api/admin/vendors/route.ts',
  'src/app/api/admin/vendors/verify/[id]/route.ts',
  'src/app/api/auth/login/route.ts',
  'src/app/api/auth/me/route.ts',
  'src/app/api/auth/verify-otp/route.ts',
  'src/app/api/bookings/[id]/accept-counter/route.ts',
  'src/app/api/bookings/[id]/accept/route.ts',
  'src/app/api/bookings/[id]/assign/route.ts',
  'src/app/api/bookings/[id]/availability/route.ts',
  'src/app/api/bookings/[id]/cancel/route.ts',
  'src/app/api/bookings/[id]/checklist/route.ts',
  'src/app/api/bookings/[id]/counter/route.ts',
  'src/app/api/bookings/[id]/dispute/route.ts',
  'src/app/api/bookings/[id]/emergency/route.ts',
  'src/app/api/bookings/[id]/invoice/route.ts',
  'src/app/api/bookings/[id]/location/route.ts',
  'src/app/api/bookings/[id]/negotiate/route.ts',
  'src/app/api/bookings/[id]/otp/check-in/route.ts',
  'src/app/api/bookings/[id]/otp/verification/route.ts',
  'src/app/api/bookings/[id]/payment-release/route.ts',
  'src/app/api/bookings/[id]/payout/route.ts',
  'src/app/api/bookings/[id]/refund/route.ts',
  'src/app/api/bookings/[id]/reject-counter/route.ts',
  'src/app/api/bookings/[id]/route.ts',
  'src/app/api/bookings/[id]/status/route.ts',
  'src/app/api/bookings/[id]/team/route.ts',
  'src/app/api/bookings/[id]/timeline/route.ts',
  'src/app/api/bookings/[id]/view/route.ts',
  'src/app/api/bookings/[id]/viewed/route.ts',
  'src/app/api/bookings/calculate/route.ts',
  'src/app/api/bookings/otp/route.ts'
];

function updateFile(filePath) {
  const fullPath = path.resolve(filePath);
  if (!fs.existsSync(fullPath)) {
    console.warn(`File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');

  if (filePath === 'src/lib/auth.ts') {
    content = 'import "server-only";\nimport { verifyAccessToken, signAccessToken, signRefreshToken } from "./auth-core";\n\nexport * from "./auth-core";\n';
  } else if (filePath === 'server.ts') {
    content = content.replace(/import\("\.\/src\/lib\/jwt"\)/g, 'import("./src/lib/auth-core")');
    content = content.replace(/const payload = verifyAccessToken\(token\);/g, 'const payload = await verifyAccessToken(token);');
  } else {
    // Replace verifyAccessToken(token) with await verifyAccessToken(token)
    // Avoid double await if already present
    content = content.replace(/(?<!await\s+)verifyAccessToken\(/g, 'await verifyAccessToken(');

    // Replace generateAccessToken with signAccessToken
    content = content.replace(/generateAccessToken/g, 'signAccessToken');

    // Replace generateRefreshToken with signRefreshToken
    content = content.replace(/generateRefreshToken/g, 'signRefreshToken');

    // Ensure signAccessToken and signRefreshToken are awaited
    content = content.replace(/(?<!await\s+)signAccessToken\(/g, 'await signAccessToken(');
    content = content.replace(/(?<!await\s+)signRefreshToken\(/g, 'await signRefreshToken(');

    // Fix imports if they were importing generate...
    content = content.replace(/import \{ .* \} from "@\/lib\/auth";/g, (match) => {
      let m = match.replace(/generateAccessToken/g, 'signAccessToken');
      m = m.replace(/generateRefreshToken/g, 'signRefreshToken');
      return m;
    });
  }

  fs.writeFileSync(fullPath, content);
  console.log(`Updated: ${filePath}`);
}

filesToUpdate.forEach(updateFile);
