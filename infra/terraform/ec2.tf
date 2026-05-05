resource "aws_instance" "bastion" {
  ami                    = "ami-02644566f8aec6865"
  instance_type          = "t2.micro"
  associate_public_ip_address = true
  subnet_id              = module.vpc.public_subnets[0]
  vpc_security_group_ids = [aws_security_group.bastion.id]
  tags = {
    "Name" = "bastion"
  }
  key_name  = "main"
  user_data = <<-EOF
              #!/bin/bash
              yum update -y
              yum upgrade -y
              yum install docker -y
              systemctl start docker.service
              systemctl enable docker.service
              docker run -d --network host -e 'PGADMIN_DEFAULT_EMAIL=ahmed.hesham.farag@gmail.com' -e 'PGADMIN_DEFAULT_PASSWORD=1234' dpage/pgadmin4
              EOF
}