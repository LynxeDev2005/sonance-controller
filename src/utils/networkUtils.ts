/**
 * Network Utilities for MAC address formatting, subnet calculation, and validation.
 */

export function sanitizeMacAddress(mac: string): string {
  const clean = mac.replace(/[^a-fA-F0-9]/g, '').toUpperCase();
  if (clean.length === 12) {
    return clean.match(/.{1,2}/g)?.join(':') || mac;
  }
  return mac;
}

export function isValidMacAddress(mac: string): boolean {
  const clean = mac.replace(/[^a-fA-F0-9]/g, '');
  return clean.length === 12;
}

export function isValidIpv4(ip: string): boolean {
  const parts = ip.trim().split('.');
  if (parts.length !== 4) return false;
  return parts.every(part => {
    const num = parseInt(part, 10);
    return !isNaN(num) && num >= 0 && num <= 255 && part === num.toString();
  });
}

export function calculateSubnetBroadcast(ip: string): string {
  if (!isValidIpv4(ip)) return '255.255.255.255';
  const parts = ip.trim().split('.');
  // Standard /24 subnet broadcast
  return `${parts[0]}.${parts[1]}.${parts[2]}.255`;
}
