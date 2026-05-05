module "s3_bucket" {
  source = "terraform-aws-modules/s3-bucket/aws"

  bucket = "ahmedhesham301-3akrati"

  block_public_policy = false
  block_public_acls = false
  force_destroy = true
  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicRead",
      "Effect": "Allow",
      "Principal": "*",
      "Action": ["s3:GetObject"],
      "Resource": ["arn:aws:s3:::ahmedhesham301-3akrati/*"]
    }
  ]
}
EOF
}