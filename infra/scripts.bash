aws eks --region $(terraform output -raw region) update-kubeconfig \
    --name $(terraform output -raw cluster_name)




eksctl delete iamserviceaccount \
  --cluster=$(terraform output -raw cluster_name) \
  --namespace=kube-system \
  --name=aws-load-balancer-controller \
  --region eu-central-1


# wait for sometime before running this
eksctl create iamserviceaccount \
    --cluster=$(terraform output -raw cluster_name) \
    --namespace=kube-system \
    --name=aws-load-balancer-controller \
    --attach-policy-arn=arn:aws:iam::011934824847:policy/AWSLoadBalancerControllerIAMPolicy \
    --override-existing-serviceaccounts \
    --region eu-central-1 \
    --approve


helm repo add eks https://aws.github.io/eks-charts
helm repo update eks

helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
  -n kube-system \
  --set region=$(terraform output -raw region) \
  --set vpcId=$(terraform output -raw vpc_id) \
  --set clusterName=$(terraform output -raw cluster_name) \
  --set serviceAccount.create=false \
  --set serviceAccount.name=aws-load-balancer-controller \
  --version 3.3.0