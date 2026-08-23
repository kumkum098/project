import { sanitizeInput, sanitizeObject, containsSQLInjection, containsXSS } from '@/lib/sanitize';

describe('Sanitization Library', () => {
  describe('sanitizeInput', () => {
    it('should strip HTML tags from input string', () => {
      const input = '<p>Hello <b>World</b></p><script>alert("xss")</script>';
      const result = sanitizeInput(input);
      expect(result).not.toContain('<p>');
      expect(result).not.toContain('<b>');
      expect(result).not.toContain('</b>');
      expect(result).not.toContain('</p>');
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('</script>');
    });

    it('should strip various HTML and XML tags including links and images', () => {
      const input = '<a href="https://malicious.com">Click Here</a><img src="x" onerror="alert(1)" />';
      const result = sanitizeInput(input);
      expect(result).not.toContain('<a');
      expect(result).not.toContain('<img');
      expect(result).not.toContain('</a>');
    });

    it('should trim leading and trailing whitespace', () => {
      const input = '   VIP Concert Ticket - Front Row   ';
      const result = sanitizeInput(input);
      expect(result).toBe('VIP Concert Ticket - Front Row');
    });

    it('should trim newlines, tabs, and carriage returns from edges', () => {
      const input = '\n\t  Wembley Stadium Section 102 \r\n ';
      const result = sanitizeInput(input);
      expect(result).toBe('Wembley Stadium Section 102');
    });

    it('should remove null bytes from input string', () => {
      const input = 'ticket\0_details\u0000_2026\x00';
      const result = sanitizeInput(input);
      expect(result).not.toContain('\0');
      expect(result).not.toContain('\u0000');
      expect(result).not.toContain('\x00');
      expect(result).toBe('ticket_details_2026');
    });

    it('should handle clean strings without modifying them', () => {
      const input = 'Coldplay Live at Mumbai 2026 - General Admission';
      const result = sanitizeInput(input);
      expect(result).toBe('Coldplay Live at Mumbai 2026 - General Admission');
    });

    it('should handle empty strings and whitespace-only strings gracefully', () => {
      expect(sanitizeInput('')).toBe('');
      expect(sanitizeInput('   ')).toBe('');
    });
  });

  describe('containsSQLInjection', () => {
    it('should detect OR 1=1 injection patterns', () => {
      expect(containsSQLInjection("' OR '1'='1")).toBe(true);
      expect(containsSQLInjection("1 OR 1=1")).toBe(true);
      expect(containsSQLInjection("' or 1=1--")).toBe(true);
      expect(containsSQLInjection("' OR 1=1#")).toBe(true);
      expect(containsSQLInjection("admin' OR 'a'='a")).toBe(true);
    });

    it('should detect DROP TABLE injection patterns', () => {
      expect(containsSQLInjection("'; DROP TABLE users; --")).toBe(true);
      expect(containsSQLInjection("DROP TABLE tickets")).toBe(true);
      expect(containsSQLInjection("1; DROP TABLE transactions;")).toBe(true);
    });

    it('should detect UNION SELECT injection patterns', () => {
      expect(containsSQLInjection("' UNION SELECT * FROM users --")).toBe(true);
      expect(containsSQLInjection("1' UNION ALL SELECT null, username, password FROM accounts--")).toBe(true);
      expect(containsSQLInjection("UNION SELECT 1, 2, 3")).toBe(true);
    });

    it('should detect other common SQL injection payloads', () => {
      expect(containsSQLInjection("admin'--")).toBe(true);
      expect(containsSQLInjection("'; EXEC xp_cmdshell('dir');--")).toBe(true);
      expect(containsSQLInjection("1'; INSERT INTO users VALUES ('hacker');--")).toBe(true);
    });

    it('should return false for safe, legitimate ticket information and descriptions', () => {
      expect(containsSQLInjection('Coldplay Music of the Spheres Tour')).toBe(false);
      expect(containsSQLInjection('Section 102, Row B, Seat 15')).toBe(false);
      expect(containsSQLInjection('Please select your preferred seating zone')).toBe(false);
      expect(containsSQLInjection('Drop off point is near Gate 4 or Gate 5')).toBe(false);
      expect(containsSQLInjection('Taylor Swift The Eras Tour - 2 VIP tickets')).toBe(false);
      expect(containsSQLInjection('')).toBe(false);
    });
  });

  describe('containsXSS', () => {
    it('should detect script tags in various formats', () => {
      expect(containsXSS("<script>alert('XSS')</script>")).toBe(true);
      expect(containsXSS("<script src='http://evil.com/xss.js'></script>")).toBe(true);
      expect(containsXSS("<SCRIPT>alert(document.cookie)</SCRIPT>")).toBe(true);
    });

    it('should detect inline HTML event handlers', () => {
      expect(containsXSS("<img src='x' onerror='alert(1)'>")).toBe(true);
      expect(containsXSS("<svg onload='alert(1)'>")).toBe(true);
      expect(containsXSS("<body onload='badCode()'>")).toBe(true);
      expect(containsXSS("<div onmouseover='stealData()'>Hover me</div>")).toBe(true);
      expect(containsXSS("<input autofocus onfocus='alert(1)'>")).toBe(true);
    });

    it('should detect javascript: URI schemes', () => {
      expect(containsXSS("<a href='javascript:alert(1)'>Click Here</a>")).toBe(true);
      expect(containsXSS("javascript:void(0)")).toBe(true);
      expect(containsXSS("<iframe src='javascript:alert(1)'></iframe>")).toBe(true);
    });

    it('should return false for safe, legitimate inputs without XSS vectors', () => {
      expect(containsXSS('Great concert ticket with excellent stage view')).toBe(false);
      expect(containsXSS('Ed Sheeran Mathematics Tour - Mumbai 2026')).toBe(false);
      expect(containsXSS('Price: $150 per ticket. Contact through platform escrow.')).toBe(false);
      expect(containsXSS('Event on 15/09/2026 at 7:30 PM (Gates open at 5:00 PM)')).toBe(false);
      expect(containsXSS('')).toBe(false);
    });
  });

  describe('sanitizeObject', () => {
    it('should recursively sanitize string fields in nested objects', () => {
      const inputObj = {
        title: '  <b>Coldplay Concert Ticket</b>  ',
        seller: {
          name: '  John Doe\0  ',
          bio: '<p>Trusted seller since 2024</p><script>alert(1)</script>',
        },
      };

      const sanitized = sanitizeObject(inputObj);

      expect(sanitized.title).not.toContain('<b>');
      expect(sanitized.title).not.toContain('</b>');
      expect(sanitized.title).toBe('Coldplay Concert Ticket');
      expect(sanitized.seller.name).toBe('John Doe');
      expect(sanitized.seller.name).not.toContain('\0');
      expect(sanitized.seller.bio).not.toContain('<p>');
      expect(sanitized.seller.bio).not.toContain('<script>');
    });

    it('should sanitize arrays of strings and objects within the structure', () => {
      const inputObj = {
        tags: ['  <b>VIP</b>  ', ' Front Row\0 ', '<i>Music</i>'],
        transactions: [
          { notes: '  <span>Paid via escrow</span>  ' },
          { notes: 'Transfer confirmed\0' },
        ],
      };

      const sanitized = sanitizeObject(inputObj);

      expect(sanitized.tags[0]).toBe('VIP');
      expect(sanitized.tags[1]).toBe('Front Row');
      expect(sanitized.tags[2]).toBe('Music');
      expect(sanitized.transactions[0].notes).toBe('Paid via escrow');
      expect(sanitized.transactions[1].notes).toBe('Transfer confirmed');
    });

    it('should preserve non-string values including numbers, booleans, and null', () => {
      const inputObj = {
        price: 250,
        isVerified: true,
        quantity: 2,
        extraData: null,
        metadata: {
          score: 85.5,
          active: false,
        },
      };

      const sanitized = sanitizeObject(inputObj);

      expect(sanitized.price).toBe(250);
      expect(sanitized.isVerified).toBe(true);
      expect(sanitized.quantity).toBe(2);
      expect(sanitized.extraData).toBeNull();
      expect(sanitized.metadata.score).toBe(85.5);
      expect(sanitized.metadata.active).toBe(false);
    });

    it('should handle empty objects and arrays', () => {
      expect(sanitizeObject({})).toEqual({});
      expect(sanitizeObject([])).toEqual([]);
    });
  });
});
