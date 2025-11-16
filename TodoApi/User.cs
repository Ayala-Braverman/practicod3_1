using System;
using System.Collections.Generic;

namespace TodoApi;

public partial class User
{
    public int Id { get; set; }

    public string? UserName { get; set; }

    public string PasswordHash { get; set; } = null!;
}
