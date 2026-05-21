module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "21.19.0"

  depends_on = [ module.fck-nat.name ]
  name               = "3akarati-cluster"
  kubernetes_version = "1.35"
  endpoint_public_access                   = true
  enable_cluster_creator_admin_permissions = true
  
  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets

  create_node_security_group                   = true
  node_security_group_enable_recommended_rules = true
  node_security_group_additional_rules = {
    "allow_alb_to_pods" = {
      type                     = "ingress"
      source_security_group_id = aws_security_group.alb.id
      ip_protocol              = "tcp"
      from_port                = 80
      to_port                  = 80
    }
  }
  addons = {
    vpc-cni = {
      before_compute = true
      most_recent    = true
    }
    coredns = {
      # before_compute = true
      most_recent    = true
    }
    kube-proxy = {
      before_compute = true
      most_recent    = true
    }
    metrics-server = {
      # before_compute = true
      most_recent    = true
    }
  }
  
  eks_managed_node_groups = {
    one = {
      min_size       = 1
      max_size       = 6
      desired_size   = 3
      instance_types = ["t3.small"]
      iam_role_additional_policies = {
        cni = "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
      }
    }
  }
}
