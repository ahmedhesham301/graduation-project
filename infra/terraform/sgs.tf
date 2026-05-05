resource "aws_security_group" "bastion" {
  name        = "bastion-sg"
  description = "nothing"
  vpc_id      = module.vpc.vpc_id
}

resource "aws_vpc_security_group_egress_rule" "allow_all_traffic_ipv4" {
  for_each = tomap({
    bastion = aws_security_group.bastion.id
  })
  security_group_id = each.value
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "-1" # semantically equivalent to all ports
}

resource "aws_vpc_security_group_ingress_rule" "allow_ssh" {
  security_group_id = aws_security_group.bastion.id
  cidr_ipv4         = var.my_ip
  ip_protocol       = "tcp"
  from_port         = 22
  to_port           = 22
}

resource "aws_vpc_security_group_ingress_rule" "allow_http" {
  security_group_id = aws_security_group.bastion.id
  cidr_ipv4         = var.my_ip
  ip_protocol       = "tcp"
  from_port         = 80
  to_port           = 80
}
###########################################

resource "aws_security_group" "db" {
  name        = "db-sg"
  description = "just a db security group"
  vpc_id      = module.vpc.vpc_id

  tags = {
    Name = "db-sg"
  }
}

resource "aws_vpc_security_group_ingress_rule" "allow_ingress_to_db" {
  for_each = tomap({
    bastion = aws_security_group.bastion.id,
    cluster = module.eks.cluster_security_group_id,
    node    = module.eks.node_security_group_id
  })
  security_group_id            = aws_security_group.db.id
  referenced_security_group_id = each.value
  ip_protocol                  = "tcp"
  from_port                    = 5432
  to_port                      = 5432
}
###########################################

resource "aws_security_group" "alb" {
  name        = "alb-sg"
  description = "nothing"
  vpc_id      = module.vpc.vpc_id

  tags = {
    Name = "alb-sg"
  }
}

resource "aws_vpc_security_group_ingress_rule" "allow_http_from_anywhere" {
  security_group_id = aws_security_group.alb.id
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "tcp"
  from_port         = 80
  to_port           = 80
}

resource "aws_vpc_security_group_egress_rule" "allow_alb_to_cluster_and_nodes" {
  for_each = tomap({
    cluster = module.eks.cluster_security_group_id,
    node    = module.eks.node_security_group_id
  })
  security_group_id = aws_security_group.alb.id
  referenced_security_group_id = each.value
  ip_protocol       = "tcp"
  from_port         = 80
  to_port           = 80
}


