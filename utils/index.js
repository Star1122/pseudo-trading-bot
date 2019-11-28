const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

exports.randomString = (length) => {
  let result = '';
  for (let i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
  return result;
};
