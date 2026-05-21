output "cluster_endpoint" {
  description = "Endpoint for EKS control plane"
  value       = module.eks.cluster_endpoint
}

output "cluster_security_group_id" {
  description = "Security group ids attached to the cluster control plane"
  value       = module.eks.cluster_security_group_id
}

output "region" {
  description = "AWS region"
  value       = var.region
}

output "cluster_name" {
  description = "Kubernetes Cluster Name"
  value       = module.eks.cluster_name
}

output "database_host" {
  description = "rds host"
  value       = module.db.db_instance_address
}

output "alb_sg_id" {
  description = "value"
  value       = aws_security_group.alb.id
}

output "vpc_id" {
  description = "value"
  value       = module.vpc.vpc_id
}

output "bastion_ip" {
  description = "value"
  value       = module.fck-nat.instance_public_ip
}