module "db" {
  source = "terraform-aws-modules/rds/aws"

  identifier = "demodb"
  
  engine         = "postgres"
  engine_version = "18"
  instance_class = "db.t4g.micro"
  skip_final_snapshot = true
  db_name                     = "postgres"
  username                    = "postgres"
  port                        = "5432"
  allocated_storage           = 5
  manage_master_user_password = false
  password_wo                 = "12345678" //just for testing
  password_wo_version         = 1

  iam_database_authentication_enabled = true
  family                              = "postgres18"
  vpc_security_group_ids              = [aws_security_group.db.id]

  # DB subnet group
  create_db_subnet_group = true
  subnet_ids             = module.vpc.private_subnets
}
