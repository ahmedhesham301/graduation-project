module "fck-nat" {
  source    = "RaJiska/fck-nat/aws"
  version   = "1.4.0"
  name      = "my-fck-nat"
  vpc_id    = module.vpc.vpc_id
  subnet_id = module.vpc.public_subnets[0]
  # ha_mode              = true                 # Enables high-availability mode
  # eip_allocation_ids   = ["eipalloc-abc1234"] # Allocation ID of an existing EIP
  # use_cloudwatch_agent = true                 # Enables Cloudwatch agent and have metrics reported

  update_route_tables = true
  route_tables_ids    = {
    for idx, rtb_id in module.vpc.private_route_table_ids:
    "rtb-${idx}" => rtb_id
  }

  instance_type                 = "t3.small"
  additional_security_group_ids = [aws_security_group.bastion.id]
  use_ssh                       = true
  ssh_key_name                  = "main"
  cloud_init_parts = [{
    content_type = "text/x-shellscript"
    content      = <<-EOF
              #!/bin/bash
              yum update -y
              yum upgrade -y
              yum install docker -y
              systemctl start docker.service
              systemctl enable docker.service
              docker run -d --network host -e 'PGADMIN_DEFAULT_EMAIL=ahmed.hesham.farag@gmail.com' -e 'PGADMIN_DEFAULT_PASSWORD=1234' dpage/pgadmin4
              EOF
  }]
}
