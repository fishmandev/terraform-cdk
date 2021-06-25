import { convert } from "../lib/index";

describe("convert", () => {
  describe("typescript", () => {
    it.each([
      [
        "output",
        `
        output "cidr_out" {
            value = "test"
        }`,
      ],
      [
        "sensitive output",
        `
        output "cidr_out" {
            value = "test"
            sensitive = true
        }`,
      ],
      [
        "output withdescription",
        `
        output "cidr_out" {
            value = "test"
            sensitive = true
            description = "Best output"
        }`,
      ],
      [
        "multiple outputs",
        `
        output "first_cidr_out" {
            value = "first"
        }
        output "second_cidr_out" {
            value = "second"
        }`,
      ],
      ["variable", `variable "weekday" {}`],
      [
        "variable with default",
        `
        variable "availability_zone_names" {
            type    = list(string)
            default = ["us-west-1a"]
            description = "What AMI to use to create an instance"
        }`,
      ],
      ["empty provider", `provider "docker" {}`],
      [
        "provider with complex config",
        `
        provider "aws" {
          access_key                  = "mock_access_key"
          region                      = "us-east-1"
          secret_key                  = "mock_secret_key"
          skip_credentials_validation = true
          skip_metadata_api_check     = true
          skip_requesting_account_id  = true
        
          endpoints {
            dynamodb = "http://localhost:8000"
          }
        }
      `,
      ],
      [
        "simple resource",
        `
        resource "aws_vpc" "example" {
          cidr_block = "10.0.0.0/16"
        }`,
      ],
      [
        "complex resource",
        ` 
        resource "aws_cloudfront_distribution" "s3_distribution" {
          origin {
            domain_name = aws_s3_bucket.b.bucket_regional_domain_name
            origin_id   = local.s3_origin_id
        
            s3_origin_config {
              origin_access_identity = "origin-access-identity/cloudfront/ABCDEFG1234567"
            }
          }
        
          enabled             = true
          is_ipv6_enabled     = true
          comment             = "Some comment"
          default_root_object = "index.html"
        
          logging_config {
            include_cookies = false
            bucket          = "mylogs.s3.amazonaws.com"
            prefix          = "myprefix"
          }
        
          aliases = ["mysite.example.com", "yoursite.example.com"]
        
          default_cache_behavior {
            allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
            cached_methods   = ["GET", "HEAD"]
            target_origin_id = local.s3_origin_id
        
            forwarded_values {
              query_string = false
        
              cookies {
                forward = "none"
              }
            }
        
            viewer_protocol_policy = "allow-all"
            min_ttl                = 0
            default_ttl            = 3600
            max_ttl                = 86400
          }
        
          # Cache behavior with precedence 0
          ordered_cache_behavior {
            path_pattern     = "/content/immutable/*"
            allowed_methods  = ["GET", "HEAD", "OPTIONS"]
            cached_methods   = ["GET", "HEAD", "OPTIONS"]
            target_origin_id = local.s3_origin_id
        
            forwarded_values {
              query_string = false
              headers      = ["Origin"]
        
              cookies {
                forward = "none"
              }
            }
        
            min_ttl                = 0
            default_ttl            = 86400
            max_ttl                = 31536000
            compress               = true
            viewer_protocol_policy = "redirect-to-https"
          }
        
          # Cache behavior with precedence 1
          ordered_cache_behavior {
            path_pattern     = "/content/*"
            allowed_methods  = ["GET", "HEAD", "OPTIONS"]
            cached_methods   = ["GET", "HEAD"]
            target_origin_id = local.s3_origin_id
        
            forwarded_values {
              query_string = false
        
              cookies {
                forward = "none"
              }
            }
        
            min_ttl                = 0
            default_ttl            = 3600
            max_ttl                = 86400
            compress               = true
            viewer_protocol_policy = "redirect-to-https"
          }
        
          price_class = "PriceClass_200"
        
          restrictions {
            geo_restriction {
              restriction_type = "whitelist"
              locations        = ["US", "CA", "GB", "DE"]
            }
          }
        
          tags = {
            Environment = "production"
          }
        
          viewer_certificate {
            cloudfront_default_certificate = true
          }
        }`,
      ],
      [
        "simple data source",
        `
        data "aws_subnet" "selected" {
          id = var.subnet_id
        }`,
      ],
    ])("%s configuration", async (_name, hcl) => {
      const code = await convert(`file.hcl`, hcl, {
        language: "typescript",
      });
      expect(code).toMatchSnapshot();
    });
  });
});
